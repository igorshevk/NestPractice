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
import { Console } from 'winston/lib/winston/transports';
import { InContentTypeDto } from '../dto/in-content-type.dto';
import { ContentType } from '../entities/content-type.entity';
import { ContentTypeSeed } from './seed/content-type.seed';

jest.setTimeout(10000);
describe('ContentType (e2e)', () => {
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
    const contentTypeSeed = new ContentTypeSeed();
    const connection: Connection = await createConnection(connectionOptions);
    const queryRunner = await connection.createQueryRunner();
    await baseSeed.up(queryRunner);
    await contentTypeSeed.up(queryRunner);
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

  describe('Add contentType', () => {
    describe('Authenticated', () => {
      it('/ (POST) 201 super user can create contentType', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/admin/content_types')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            name,
            title,
          } as InContentTypeDto)
          .expect(201)
          .then(res => {
            expect(res.body.contentType.name).toBe(name);
            expect(res.body.contentType.title).toBe(title);
          });
      });

      it('/ (POST) 201 admin user can create contentType', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/admin/content_types')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .send({
            name,
            title,
          } as InContentTypeDto)
          .expect(201)
          .then(res => {
            expect(res.body.contentType.name).toBe(name);
            expect(res.body.contentType.title).toBe(title);
          });
      });

      it('/ (POST) 201 inactive admin user can create contentType', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/admin/content_types')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .send({
            name,
            title,
          } as InContentTypeDto)
          .expect(201)
          .then(res => {
            expect(res.body.contentType.name).toBe(name);
            expect(res.body.contentType.title).toBe(title);
          });
      });

      it('/ (POST) 201 staff user with contentType can create contentType', () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'addContentTypeUser@addContentTypeUser.com',
            password: pass,
          })
          .then(res => {
            return request(app.getHttpServer())
              .post('/api/admin/content_types')
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .send({
                name,
                title,
              } as InContentTypeDto)
              .expect(201)
              .then(res => {
                expect(res.body.contentType.name).toBe(name);
                expect(res.body.contentType.title).toBe(title);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (POST) 403 guest user cannot create contentType', () => {
        return request(app.getHttpServer())
          .post('/api/admin/content_types')
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (POST) 403 general user cannot create contentType', () => {
        return request(app.getHttpServer())
          .post('/api/admin/content_types')
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

  describe('Change contentType', () => {
    let contentType: ContentType;
    beforeEach(async () => {
      const name = faker.name.findName();
      const title = faker.random.word();
      contentType = await request(app.getHttpServer())
        .post('/api/admin/content_types')
        .set('tnid', 'master')
        .set('Authorization', `JWT ${superToken}`)
        .send({
          name,
          title,
        } as InContentTypeDto)
        .expect(201)
        .then(res => {
          return res.body.contentType;
        });
    });

    describe('Authenticated', () => {
      it('/ (PUT) 200 super user can change contentType', () => {
        const name = faker.name.firstName();
        const title = faker.random.word();

        return request(app.getHttpServer())
          .put(`/api/admin/content_types/${contentType.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            name,
            title,
          } as InContentTypeDto)
          .expect(200)
          .then(res => {
            expect(res.body.contentType.name).toBe(name);
            expect(res.body.contentType.title).toBe(title);
          });
      });

      it('/ (PUT) 200 admin user can change contentType', () => {
        const name = faker.name.firstName();
        const title = faker.random.word();

        return request(app.getHttpServer())
          .put(`/api/admin/content_types/${contentType.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .send({
            name,
            title,
          } as InContentTypeDto)
          .expect(200)
          .then(res => {
            expect(res.body.contentType.name).toBe(name);
            expect(res.body.contentType.title).toBe(title);
          });
      });

      it('/ (PUT) 200 inactive admin user can change contentType', () => {
        const name = faker.name.firstName();
        const title = faker.random.word();

        return request(app.getHttpServer())
          .put(`/api/admin/content_types/${contentType.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .send({
            name,
            title,
          } as InContentTypeDto)
          .expect(200)
          .then(res => {
            expect(res.body.contentType.name).toBe(name);
            expect(res.body.contentType.title).toBe(title);
          });
      });

      it('/ (PUT) 200 staff user with contentType can change user', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'changeContentTypeUser@changeContentTypeUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            const name = faker.name.firstName();
            const title = faker.random.word();

            return request(app.getHttpServer())
              .put(`/api/admin/content_types/${contentType.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${adminInactiveToken}`)
              .send({
                name,
                title,
              } as InContentTypeDto)
              .expect(200)
              .then(res => {
                expect(res.body.contentType.name).toBe(name);
                expect(res.body.contentType.title).toBe(title);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (PUT) 403 guest user cannot change user', () => {
        return request(app.getHttpServer())
          .put('/api/admin/content_types/3')
          .set('tnid', 'master')
          .send({
            name: faker.name.firstName(),
            title: faker.random.word(),
          })
          .expect(403);
      });

      it('/ (PUT) 403 general user cannot change user', () => {
        return request(app.getHttpServer())
          .put('/api/admin/content_types/3')
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

  describe('Delete contentType', () => {
    describe('Authenticated', () => {
      let contentType: ContentType;
      beforeEach(async () => {
        const name = faker.name.findName();
        const title = faker.random.word();
        contentType = await request(app.getHttpServer())
          .post('/api/admin/content_types')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .send({
            name,
            title,
          } as InContentTypeDto)
          .expect(201)
          .then(res => {
            return res.body.contentType;
          });
      });

      it('/ (DELETE) 204 super user can delete contentType', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/content_types/${contentType.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/content_types/${contentType.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 admin user can delete contentType', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/content_types/${contentType.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/content_types/${contentType.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 inactive admin user can delete contentType', () => {
        return request(app.getHttpServer())
          .delete(`/api/admin/content_types/${contentType.id}`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(204)
          .then(() => {
            return request(app.getHttpServer())
              .get(`/api/admin/content_types/${contentType.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${superToken}`)
              .expect(404);
          });
      });

      it('/ (DELETE) 200 staff user with contentType can delete contentType', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'deleteContentTypeUser@deleteContentTypeUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .delete(`/api/admin/content_types/${contentType.id}`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .expect(204)
              .then(() => {
                return request(app.getHttpServer())
                  .get(`/api/admin/content_types/${contentType.id}`)
                  .set('tnid', 'master')
                  .set('Authorization', `JWT ${superToken}`)
                  .expect(404);
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (DELETE) 403 guest user cannot delete contentType', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/content_types/3')
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (DELETE) 403 general user cannot delete contentType', () => {
        return request(app.getHttpServer())
          .delete('/api/admin/content_types/3')
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .expect(403);
      });
    });
  });

  describe('Read contentType', () => {
    describe('Authenticated', () => {
      it('/ (GET) 200 super user can read contentType', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.contentType.id).toBe(1);
            expect(res.body.contentType.name).toBeDefined();
            expect(res.body.contentType.title).toBeDefined();
          });
      });

      it('/ (GET) 200 admin user can read contentType', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.contentType.id).toBe(1);
            expect(res.body.contentType.name).toBeDefined();
            expect(res.body.contentType.title).toBeDefined();
          });
      });

      it('/ (GET) 200 inactive admin user can read contentType', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.contentType.id).toBe(1);
            expect(res.body.contentType.name).toBeDefined();
            expect(res.body.contentType.title).toBeDefined();
          });
      });

      it('/ (GET) 200 staff user with contentType can read contentType', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'readContentTypeUser@readContentTypeUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .get(`/api/admin/content_types/1`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${res.body.token}`)
              .expect(200)
              .then(res => {
                expect(res.body.contentType.id).toBe(1);
                expect(res.body.contentType.name).toBeDefined();
                expect(res.body.contentType.title).toBeDefined();
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (GET) 403 guest user cannot read contentType', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types/1`)
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (GET) 403 general user cannot read contentType', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types/1`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${staffToken}`)
          .expect(403);
      });
    });
  });

  describe('Read contentTypes', () => {
    describe('Authenticated', () => {
      it('/ (GET) 200 super user can read contentTypes', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${superToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.contentTypes).toBeDefined();
            expect(res.body.meta).toBeDefined();
            expect(res.body.meta.curPage).toBeDefined();
            expect(res.body.meta.perPage).toBeDefined();
            expect(res.body.meta.totalPages).toBeDefined();
            expect(res.body.meta.totalResults).toBeDefined();
          });
      });

      it('/ (GET) 200 admin user can read contentTypes', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.contentTypes).toBeDefined();
            expect(res.body.meta).toBeDefined();
          });
      });

      it('/ (GET) 200 inactive admin user can read contentTypes', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types`)
          .set('tnid', 'master')
          .set('Authorization', `JWT ${adminInactiveToken}`)
          .expect(200)
          .then(res => {
            expect(res.body.contentTypes).toBeDefined();
            expect(res.body.meta).toBeDefined();
          });
      });

      it('/ (GET) 200 staff user with contentType can read contentType', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signin')
          .set('tnid', 'master')
          .send({
            email: 'readContentTypeUser@readContentTypeUser.com',
            password: pass,
          })
          .expect(200)
          .then(res => {
            return request(app.getHttpServer())
              .get(`/api/admin/content_types`)
              .set('tnid', 'master')
              .set('Authorization', `JWT ${adminInactiveToken}`)
              .expect(200)
              .then(res => {
                expect(res.body.contentTypes).toBeDefined();
                expect(res.body.meta).toBeDefined();
              });
          });
      });
    });

    describe('Unauthenticated', () => {
      it('/ (GET) 403 guest user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types`)
          .set('tnid', 'master')
          .expect(403);
      });

      it('/ (GET) 403 general user cannot read user', () => {
        return request(app.getHttpServer())
          .get(`/api/admin/content_types`)
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
