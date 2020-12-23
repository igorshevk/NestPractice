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
import { UserSeed } from './seed/user.seed';
import { Group } from '../entities/group.entity';
import * as faker from 'faker';
import { InCreateUserDto } from '../dto/in-create-user.dto';
import { InUserDto } from '../dto/in-user.dto';
import { User } from '../entities/user.entity';
import { Console } from 'winston/lib/winston/transports';

jest.setTimeout(10000);
describe('User (e2e)', () => {
  let app;
  let connectionOptions: ConnectionOptions;
  // Create data
  const admin = 'admin@admin.com';
  const user1 = 'user1@user1.com';
  const user4 = 'user4@user4.com';
  const user5 = 'user5@user5.com';
  const user6 = 'user6@user6.com';
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
    const userSeed = new UserSeed();
    const connection: Connection = await createConnection(connectionOptions);
    const queryRunner = await connection.createQueryRunner();
    await baseSeed.up(queryRunner);
    await userSeed.up(queryRunner);
    gAdmin = await connection.getRepository(Group).findOneOrFail({
      where: {
        name: 'admin',
      },
      relations: ['permissions'],
    });
    gUser = await connection.getRepository(Group).findOneOrFail({
      where: {
        name: 'user',
      },
      relations: ['permissions'],
    });
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
        email: admin,
        password: pass,
      })
      .then(res => res.body.token);
    staffToken = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .set('tnid', 'master')
      .send({
        email: user1,
        password: pass,
      })
      .then(res => res.body.token);
    adminInactiveToken = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .set('tnid', 'master')
      .send({
        email: user6,
        password: pass,
      })
      .then(res => res.body.token);
    addUserToken = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .set('tnid', 'master')
      .send({
        email: 'addUser@addUser.com',
        password: pass,
      })
      .then(res => res.body.token);
  });

  describe('Add user', () => {
    describe('Authenticated', () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();

      it('/ (POST) 201 super user can create user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();
        return request(app.getHttpServer())
          .post('/api/admin/users')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            email,
            username,
            password: pass,
            firstName,
            lastName,
            isSuperuser: false,
          } as InCreateUserDto)
          .expect(201)
          .then(res => {
            expect(res.body.user.email).toBe(email);
            expect(res.body.user.username).toBe(username);
            expect(res.body.user.firstName).toBe(firstName);
            expect(res.body.user.lastName).toBe(lastName);
          });
      });

      it('/ (POST) 201 admin user can create user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();
        return request(app.getHttpServer())
          .post('/api/admin/users')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .send({
            email,
            username,
            password: pass,
            firstName,
            lastName,
            isSuperuser: false,
          } as InCreateUserDto)
          .expect(201)
          .then(res => {
            expect(res.body.user.email).toBe(email);
            expect(res.body.user.username).toBe(username);
            expect(res.body.user.firstName).toBe(firstName);
            expect(res.body.user.lastName).toBe(lastName);
          });
      });

      it('/ (POST) 201 inactive admin user can create user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();
        return request(app.getHttpServer())
          .post('/api/admin/users')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .send({
            email,
            username,
            password: pass,
            firstName,
            lastName,
            isSuperuser: false,
          } as InCreateUserDto)
          .expect(201)
          .then(res => {
            expect(res.body.user.email).toBe(email);
            expect(res.body.user.username).toBe(username);
            expect(res.body.user.firstName).toBe(firstName);
            expect(res.body.user.lastName).toBe(lastName);
          });
      });

      it('/ (POST) 201 staff user with permission can create user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();
        return request(app.getHttpServer())
          .post('/api/admin/users')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${addUserToken}`)
          .send({
            email,
            username,
            password: pass,
            firstName,
            lastName,
            isSuperuser: false,
          } as InCreateUserDto)
          .expect(201)
          .then(res => {
            expect(res.body.user.email).toBe(email);
            expect(res.body.user.username).toBe(username);
            expect(res.body.user.firstName).toBe(firstName);
            expect(res.body.user.lastName).toBe(lastName);
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (POST) 403 guest user cannot create user', () => {
        return request(app.getHttpServer())
          .post('/api/admin/users')
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (POST) 403 general user cannot create user', () => {
        return request(app.getHttpServer())
          .post('/api/admin/users')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .send({
            email: user5,
            username: 'user55',
            password: pass,
            firstName: 'test',
            lastName: 'test',
          })
          .expect(403);
      });
    });
  });

  describe('Change user', () => {
    describe('Authenticated', () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();

      it('/ (PUT) 200 super user can change user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();

        return request(app.getHttpServer())
          .put('/api/admin/users/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            email,
            username,
            password: pass,
            firstName,
            lastName,
            isSuperuser: false,
          } as InUserDto)
          .expect(200)
          .then(res => {
            expect(res.body.user.email).toBe(email);
            expect(res.body.user.username).toBe(username);
            expect(res.body.user.firstName).toBe(firstName);
            expect(res.body.user.lastName).toBe(lastName);
          });
      });

      it('/ (PUT) 200 admin user can change user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();

        return request(app.getHttpServer())
          .put('/api/admin/users/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .send({
            email,
            username,
            password: pass,
            firstName,
            lastName,
            isSuperuser: false,
          } as InUserDto)
          .expect(200)
          .then(res => {
            expect(res.body.user.firstName).toBe(firstName);
          });
      });

      it('/ (PUT) 200 inactive admin user can change user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();

        return request(app.getHttpServer())
          .put('/api/admin/users/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .send({
            email,
            username,
            password: pass,
            firstName,
            lastName,
            isSuperuser: false,
          } as InUserDto)
          .expect(200)
          .then(res => {
            expect(res.body.user.email).toBe(email);
            expect(res.body.user.username).toBe(username);
            expect(res.body.user.firstName).toBe(firstName);
            expect(res.body.user.lastName).toBe(lastName);
          });
      });

      it('/ (PUT) 200 staff user with permission can change user', () => {
        const username = faker.name.firstName();
        const email = faker.internet.email();

        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'changeUser@changeUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .put('/api/admin/users/3')
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .send({
                email,
                username,
                password: pass,
                firstName,
                lastName,
                isSuperuser: false,
              } as InUserDto)
              .expect(200)
              .then(res => {
                expect(res.body.user.email).toBe(email);
                expect(res.body.user.username).toBe(username);
                expect(res.body.user.firstName).toBe(firstName);
                expect(res.body.user.lastName).toBe(lastName);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (PUT) 403 guest user cannot change user', () => {
        return request(app.getHttpServer())
          .put('/api/admin/users/3')
          .set('tnid', 'master')
          .send({
            email: user5,
            username: 'user55',
            password: pass,
            firstName: 'test',
            lastName: 'test',
          })
          .expect(403);
      });

      it('/ (PUT) 403 general user cannot change user', () => {
        return request(app.getHttpServer())
          .put('/api/admin/users/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .send({
            email: user5,
            username: 'user55',
            password: pass,
            firstName: 'test',
            lastName: 'test',
          })
          .expect(403);
      });
    });
  });

  describe('Delete user', () => {
    describe('Authenticated', () => {
      let user1: User;
      beforeEach(async () => {
        async function newUser() {
          const email = faker.internet.email();
          const username = faker.name.firstName();
          const firstName = faker.name.firstName();
          const lastName = faker.name.lastName();
          return request(app.getHttpServer())
            .post('/api/admin/users')
            .set('tnid', 'master')
            .set('Authorization', `JWT ${superToken}`)
            .send({
              email,
              username,
              password: pass,
              firstName,
              lastName,
              isSuperuser: false,
            } as InCreateUserDto)
            .expect(201)
            .then(res => {
              return res.body.user;
            });
        }
        user1 = await newUser();
      });

      it('/ (DELETE) 204 super user can delete user', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/users/${user1.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/users/${user1.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 admin user can delete user', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/users/${user1.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/users/${user1.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 inactive admin user can delete user', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/users/${user1.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/users/${user1.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 staff user with permission can delete user', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'deleteUser@deleteUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .delete(`/api/admin/users/${user1.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .expect(204)
              .then(() => {
                return request(app.getHttpServer())
                  .get(`/api/admin/users/${user1.id}`)
                  .set('tnid', 'master')
                  .set('Authorization', `JWT ${superToken}`)
                  .expect(404);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (DELETE) 403 guest user cannot delete user', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/users/3')
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (DELETE) 403 general user cannot delete user', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/users/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .expect(403);
      });
    });
  });

  describe('Read user', () => {
    describe('Authenticated', () => {
      it('/ (GET) 200 super user can read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.user.email).toBe('super@super.com');
            expect(res.body.user.username).toBe('super');
            expect(res.body.user.lastLogin).toBeDefined();
            expect(res.body.user.isSuperuser).toBeDefined();
            expect(res.body.user.firstName).toBeDefined();
            expect(res.body.user.lastName).toBeDefined();
            expect(res.body.user.isStaff).toBeDefined();
            expect(res.body.user.isActive).toBeDefined();
            expect(res.body.user.groups).toBeDefined();
            expect(res.body.user.groups[0].id).toBeDefined();
            expect(res.body.user.groups[0].name).toBeDefined();
            expect(res.body.user.groups[0].title).toBeDefined();
            expect(res.body.user.groups[0].permissions).toBeDefined();
            expect(res.body.user.groups[0].permissions[0]).toBeDefined();
            expect(res.body.user.groups[0].permissions[0].id).toBeDefined();
            expect(res.body.user.groups[0].permissions[0].name).toBeDefined();
            expect(res.body.user.groups[0].permissions[0].title).toBeDefined();
            expect(
              res.body.user.groups[0].permissions[0].contentType,
            ).toBeDefined();
            expect(
              res.body.user.groups[0].permissions[0].contentType.id,
            ).toBeDefined();
            expect(
              res.body.user.groups[0].permissions[0].contentType.name,
            ).toBeDefined();
            expect(
              res.body.user.groups[0].permissions[0].contentType.title,
            ).toBeDefined();
            expect(res.body.user.passport).toBeUndefined();
          });
      });

      it('/ (GET) 200 admin user can read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.user.email).toBe('super@super.com');
            expect(res.body.user.username).toBe('super');
            expect(res.body.user.passport).toBeUndefined();
          });
      });

      it('/ (GET) 200 inactive admin user can read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.user.email).toBe('super@super.com');
            expect(res.body.user.username).toBe('super');
            expect(res.body.user.passport).toBeUndefined();
          });
      });

      it('/ (GET) 200 staff user with permission can read user', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'readUser@readUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .get(`/api/admin/users/1`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .expect(200)
              .then(res => {
                expect(res.body.user.email).toBe('super@super.com');
                expect(res.body.user.username).toBe('super');
                expect(res.body.user.passport).toBeUndefined();
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (GET) 403 guest user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/1`)
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (GET) 403 general user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .expect(403);
      });
    });
  });

  describe('Read users', () => {
    describe('Authenticated', () => {
      it('/ (GET) 200 super user can read users', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.users).toBeDefined();
            expect(res.body.meta).toBeDefined();
            expect(res.body.meta.curPage).toBeDefined();
            expect(res.body.meta.perPage).toBeDefined();
            expect(res.body.meta.totalPages).toBeDefined();
            expect(res.body.meta.totalResults).toBeDefined();
            expect(res.body.users[0].email).toBeDefined();
            expect(res.body.users[0].username).toBeDefined();
            expect(res.body.users[0].passport).toBeUndefined();
            expect(res.body.users[0].groups).toBeDefined();
          });
      });

      it('/ (GET) 200 admin user can read users', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.users).toBeDefined();
            expect(res.body.meta).toBeDefined();
          });
      });

      it('/ (GET) 200 inactive admin user can read users', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.users).toBeDefined();
            expect(res.body.meta).toBeDefined();
          });
      });

      it('/ (GET) 200 staff user with permission can read users', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'readUser@readUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .get(`/api/admin/users`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .expect(200)
              .then(res => {
                expect(res.body.users).toBeDefined();
                expect(res.body.meta).toBeDefined();
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (GET) 403 guest user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users`)
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (GET) 403 general user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/users`)
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
