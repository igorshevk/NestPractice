import {
  AuthModule,
  DEFAULT_FACEBOOK_CONFIG,
  DEFAULT_GOOGLE_PLUS_CONFIG,
  DEFAULT_JWT_CONFIG,
} from '@lib/auth';
import { TenantModule } from '@lib/tenant';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import * as request from 'supertest';
import {
  Connection,
  ConnectionOptions,
  createConnection,
  getConnectionOptions,
} from 'typeorm';
import { CORE_CONFIG_TOKEN, DEFAULT_CORE_CONFIG } from '../configs/core.config';
import { CoreModule } from '../core.module';
import * as winston from 'winston';
import { PassportModule } from '@nestjs/passport';
import { BaseSeed } from './seed/base.seed';
import * as faker from 'faker';
import { InCreateUserDto } from '../dto/in-create-user.dto';
import { InUserDto } from '../dto/in-user.dto';
import { User } from '../entities/user.entity';
import { Console } from 'winston/lib/winston/transports';
import { InGroupDto } from '../dto/in-group.dto';
import { GroupSeed } from './seed/group.seed';
import { Group } from '../entities/group.entity';

jest.setTimeout(10000);
describe('Group (e2e)', () => {
  let app;
  let connectionOptions: ConnectionOptions;
  // Create data
  let adminToken;
  let staffToken;
  let adminInactiveToken;
  let superToken;
  let addUserToken;
  let gAdmin;
  let gUser;
  const pass = '12345678';

  beforeAll(async () => {
    // Get connection options
    connectionOptions = await getConnectionOptions('test');
  });

  beforeEach(async () => {
    connectionOptions = {
      ...connectionOptions,
      name: 'default',
      synchronize: true,
      dropSchema: true,
    };

    const baseSeed = new BaseSeed();
    const groupSeed = new GroupSeed();
    const connection: Connection = await createConnection(connectionOptions);
    const queryRunner = await connection.createQueryRunner();
    await baseSeed.up(queryRunner);
    await groupSeed.up(queryRunner);
    await connection.close();

    connectionOptions = {
      ...connectionOptions,
      name: 'default',
      synchronize: false,
      dropSchema: false,
    };

    // Create server
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        WinstonModule.forRoot({
          level: 'info',
          format: winston.format.json(),
          transports: [new Console()],
        }),
        TypeOrmModule.forRoot(connectionOptions),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        CoreModule.forRoot({
          providers: [
            {
              provide: CORE_CONFIG_TOKEN,
              useValue: {
                ...DEFAULT_CORE_CONFIG,
              },
            },
          ],
        }),
        AuthModule.forRootAsync(
          {
            useFactory: () => ({
              ...DEFAULT_FACEBOOK_CONFIG,
              client_id: 'test',
              client_secret: 'test',
              oauth_redirect_uri: 'test',
            }),
            imports: [],
          },
          {
            useFactory: () => ({ ...DEFAULT_GOOGLE_PLUS_CONFIG }),
            imports: [],
          },
          {
            useFactory: () => ({ ...DEFAULT_JWT_CONFIG }),
            imports: [],
          },
          {
            useFactory: () => ({ ...DEFAULT_CORE_CONFIG }),
            imports: [],
          },
        ),
        TenantModule.forRoot([]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    await app.init();

    // frequency use
    superToken = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .set('tnid', 'master')
      .send({
        email: 'super@super.com',
        password: pass,
      })
      .then(res => res.body.token);
    adminToken = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .set('tnid', 'master')
      .send({
        email: 'admin@admin.com',
        password: pass,
      })
      .then(res => res.body.token);
    staffToken = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .set('tnid', 'master')
      .send({
        email: 'user1@user1.com',
        password: pass,
      })
      .then(res => res.body.token);
    adminInactiveToken = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .set('tnid', 'master')
      .send({
        email: 'inactiveAdmin@inactiveAdmin.com',
        password: pass,
      })
      .then(res => res.body.token);
  });

  describe('Add group', () => {
    describe('Authenticated', () => {
      it('/ (POST) 201 super user can create group', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/admin/groups')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            name,
            title,
          } as InGroupDto)
          .expect(201)
          .then(res => {
            expect(res.body.group.name).toBe(name);
            expect(res.body.group.title).toBe(title);
          });
      });

      it('/ (POST) 201 admin user can create group', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/admin/groups')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .send({
            name,
            title,
          } as InGroupDto)
          .expect(201)
          .then(res => {
            expect(res.body.group.name).toBe(name);
            expect(res.body.group.title).toBe(title);
          });
      });

      it('/ (POST) 201 inactive admin user can create group', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/admin/groups')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .send({
            name,
            title,
          } as InGroupDto)
          .expect(201)
          .then(res => {
            expect(res.body.group.name).toBe(name);
            expect(res.body.group.title).toBe(title);
          });
      });

      it('/ (POST) 201 staff user with permission can create group', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'addGroupUser@addGroupUser.com',
            password: pass,
          })
          .then(res => {
            return request(app.getHttpServer())
              .post('/api/admin/groups')
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .send({
                name,
                title,
              } as InGroupDto)
              .expect(201)
              .then(res => {
                expect(res.body.group.name).toBe(name);
                expect(res.body.group.title).toBe(title);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (POST) 403 guest user cannot create group', () => {
        return request(app.getHttpServer())
          .post('/api/admin/groups')
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (POST) 403 general user cannot create group', () => {
        return request(app.getHttpServer())
          .post('/api/admin/groups')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .send({
            name: faker.name.firstName(),
            title: faker.random.word(),
          })
          .expect(403);
      });
    });
  });

  describe('Change group', () => {
    let group: Group;
    beforeEach(async () => {
      const name = faker.name.findName();
      const title = faker.random.word();
      group = await request(app.getHttpServer())
        .post('/api/admin/groups')
        .set('tnid', 'master')
        .set('Authorization', `JWT ${superToken}`)
        .send({
          name,
          title,
        } as InGroupDto)
        .expect(201)
        .then(res => {
          return res.body.group;
        });
    });

    describe('Authenticated', () => {
      it('/ (PUT) 200 super user can change group', () => {
        const name = faker.name.firstName();
        const title = faker.random.word();

        return request(app.getHttpServer())
          .put(`/api/admin/groups/${group.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            name,
            title,
          } as InGroupDto)
          .expect(200)
          .then(res => {
            expect(res.body.group.name).toBe(name);
            expect(res.body.group.title).toBe(title);
          });
      });

      it('/ (PUT) 200 admin user can change group', () => {
        const name = faker.name.firstName();
        const title = faker.random.word();

        return request(app.getHttpServer())
          .put(`/api/admin/groups/${group.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .send({
            name,
            title,
          } as InGroupDto)
          .expect(200)
          .then(res => {
            expect(res.body.group.name).toBe(name);
            expect(res.body.group.title).toBe(title);
          });
      });

      it('/ (PUT) 200 inactive admin user can change group', () => {
        const name = faker.name.firstName();
        const title = faker.random.word();

        return request(app.getHttpServer())
          .put(`/api/admin/groups/${group.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .send({
            name,
            title,
          } as InGroupDto)
          .expect(200)
          .then(res => {
            expect(res.body.group.name).toBe(name);
            expect(res.body.group.title).toBe(title);
          });
      });

      it('/ (PUT) 200 staff user with permission can change user', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'changeGroupUser@changeGroupUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            const name = faker.name.firstName();
            const title = faker.random.word();

            return request(app.getHttpServer())
              .put(`/api/admin/groups/${group.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${adminInactiveToken}`)
              .send({
                name,
                title,
              } as InGroupDto)
              .expect(200)
              .then(res => {
                expect(res.body.group.name).toBe(name);
                expect(res.body.group.title).toBe(title);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (PUT) 403 guest user cannot change user', () => {
        return request(app.getHttpServer())
          .put('/api/admin/groups/3')
          .set('tnid', 'master')
          .send({
            name: faker.name.firstName(),
            title: faker.random.word(),
          })
          .expect(403);
      });

      it('/ (PUT) 403 general user cannot change user', () => {
        return request(app.getHttpServer())
          .put('/api/admin/groups/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .send({
            name: faker.name.firstName(),
            title: faker.random.word(),
          })
          .expect(403);
      });
    });
  });

  describe('Delete group', () => {
    describe('Authenticated', () => {
      let group: Group;
      beforeEach(async () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        group = await request(app.getHttpServer())
          .post('/api/admin/groups')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            name,
            title,
          } as InGroupDto)
          .expect(201)
          .then(res => {
            return res.body.group;
          });
      });

      it('/ (DELETE) 204 super user can delete group', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/groups/${group.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/groups/${group.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 admin user can delete group', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/groups/${group.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/groups/${group.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 inactive admin user can delete group', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/groups/${group.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/groups/${group.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 staff user with permission can delete group', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'deleteGroupUser@deleteGroupUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .delete(`/api/admin/groups/${group.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .expect(204)
              .then(() => {
                return request(app.getHttpServer())
                  .get(`/api/admin/groups/${group.id}`)
                  .set('tnid', 'master')
                  .set('Authorization', `JWT ${superToken}`)
                  .expect(404);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (DELETE) 403 guest user cannot delete group', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/groups/3')
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (DELETE) 403 general user cannot delete group', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/groups/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .expect(403);
      });
    });
  });

  describe('Read group', () => {
    describe('Authenticated', () => {
      it('/ (GET) 200 super user can read group', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.group.id).toBe(1);
            expect(res.body.group.name).toBeDefined();
            expect(res.body.group.title).toBeDefined();

            expect(res.body.group.permissions).toBeDefined();
            expect(res.body.group.permissions[0]).toBeDefined();
            expect(res.body.group.permissions[0].id).toBeDefined();
            expect(res.body.group.permissions[0].name).toBeDefined();
            expect(res.body.group.permissions[0].title).toBeDefined();
            expect(res.body.group.permissions[0].contentType).toBeDefined();
            expect(res.body.group.permissions[0].contentType.id).toBeDefined();
            expect(
              res.body.group.permissions[0].contentType.name,
            ).toBeDefined();
            expect(
              res.body.group.permissions[0].contentType.title,
            ).toBeDefined();
          });
      });

      it('/ (GET) 200 admin user can read group', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.group.id).toBe(1);
            expect(res.body.group.name).toBeDefined();
            expect(res.body.group.title).toBeDefined();
          });
      });

      it('/ (GET) 200 inactive admin user can read group', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.group.id).toBe(1);
            expect(res.body.group.name).toBeDefined();
            expect(res.body.group.title).toBeDefined();
          });
      });

      it('/ (GET) 200 staff user with permission can read group', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'readGroupUser@readGroupUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .get(`/api/admin/groups/1`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .expect(200)
              .then(res => {
                expect(res.body.group.id).toBe(1);
                expect(res.body.group.name).toBeDefined();
                expect(res.body.group.title).toBeDefined();
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (GET) 403 guest user cannot read group', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups/1`)
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (GET) 403 general user cannot read group', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .expect(403);
      });
    });
  });

  describe('Read groups', () => {
    describe('Authenticated', () => {
      it('/ (GET) 200 super user can read groups', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.groups).toBeDefined();
            expect(res.body.meta).toBeDefined();
            expect(res.body.meta.curPage).toBeDefined();
            expect(res.body.meta.perPage).toBeDefined();
            expect(res.body.meta.totalPages).toBeDefined();
            expect(res.body.meta.totalResults).toBeDefined();
            expect(res.body.groups[0].id).toBeDefined();
            expect(res.body.groups[0].name).toBeDefined();
            expect(res.body.groups[0].title).toBeDefined();
            expect(res.body.groups[0].permissions).toBeDefined();
          });
      });

      it('/ (GET) 200 admin user can read groups', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.groups).toBeDefined();
            expect(res.body.meta).toBeDefined();
          });
      });

      it('/ (GET) 200 inactive admin user can read groups', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.groups).toBeDefined();
            expect(res.body.meta).toBeDefined();
          });
      });

      it('/ (GET) 200 staff user with permission can read group', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'readGroupUser@readGroupUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .get(`/api/admin/groups`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${adminInactiveToken}`)
              .expect(200)
              .then(res => {
                expect(res.body.groups).toBeDefined();
                expect(res.body.meta).toBeDefined();
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (GET) 403 guest user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups`)
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (GET) 403 general user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/groups`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .expect(403);
      });
    });
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    // Empty
  });
});
