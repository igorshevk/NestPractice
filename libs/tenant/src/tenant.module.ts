import {
  BadRequestException,
  DynamicModule,
  forwardRef,
  HttpException,
  MiddlewareConsumer,
  Module,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MASTER_TNID, TENANT_CONNECTION, TENANT_ID_HEADER } from './const';
import { DatabaseModule } from './database/database.module';
import { TenantEntity } from './tenant.entity';
import { Connection, createConnection, getConnection } from 'typeorm';
import { TenantController } from './tenant.controller';
import { TenantServicez } from './tenant.service';
import { Response } from 'express';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity]),
    forwardRef(() => DatabaseModule),
  ],
  providers: [
    {
      provide: TENANT_CONNECTION,
      inject: [REQUEST, Connection],
      scope: Scope.REQUEST,
      useFactory: async (request, connection) => {
        if (request.headers[TENANT_ID_HEADER] === MASTER_TNID) {
          return getConnection('default');
        } else {
          const tenant: TenantEntity = await connection
            .getRepository(TenantEntity)
            .findOne({ where: { path: request.headers[TENANT_ID_HEADER] } });

          return getConnection(tenant.path);
        }
      },
    },
  ],
  exports: [TENANT_CONNECTION],
})
export class TenantModule {
  constructor(private readonly connection: Connection) {}
  static entities: any[];

  static forRoot(entities: any): DynamicModule {
    TenantModule.entities = entities;

    return {
      module: TenantModule,
      providers: [
        TenantController,
        TenantServicez,
        {
          provide: TENANT_CONNECTION,
          inject: [REQUEST, Connection],
          scope: Scope.REQUEST,
          useFactory: async (request, connection) => {
            if (request.headers[TENANT_ID_HEADER] === MASTER_TNID) {
              return getConnection('default');
            }
            const tenant: TenantEntity = await connection
              .getRepository(TenantEntity)
              .findOne({ where: { path: request.headers[TENANT_ID_HEADER] } });

            return getConnection(tenant.path);
          },
        },
      ],
      exports: [TENANT_CONNECTION],
      controllers: [TenantController],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer
      // .apply(async (req, res: Response, next) => {
      /**
       * Depend on strategy we have two options
       *  (1) Users are in master
       *  (2) Users are in tenant DB
       *
       * For now we implement (1) for simplify
       */
      // next();

      // No need any more
      // if (req.headers[TENANT_ID_HEADER] !== MASTER_TNID) {
      //   res.send(404);
      // } else {
      //   next();
      // }
      // })
      // .forRoutes('api/admin/(.*)')
      .apply(async (req, res, next) => {
        const tenant: TenantEntity = await this.connection
          // TODO for future use host now use tenantId
          // .getRepository(TenantEntity).findOne(({ relations: ['database'], where: { host: req.headers.host } }));
          .getRepository(TenantEntity)
          .findOne({
            relations: ['database'],
            where: { path: req.headers[TENANT_ID_HEADER] },
          });

        if (!tenant) {
          throw new BadRequestException(
            'Database Connection Error',
            'There is a Error with the Database!',
          );
        }
        const database = tenant.database;
        if (!database) {
          throw new BadRequestException(
            'Database Connection Error',
            'There is a Error with the tenant Database!',
          );
        }

        try {
          getConnection(tenant.path);
          next();
        } catch (e) {
          // TODO fallback to current hostname
          const createdConnection: Connection | void = await createConnection({
            name: tenant.path,
            type: database.type as any,
            host: database.host,
            port: database.port,
            username: database.username,
            password: database.password,
            database: database.database,
            entities: [...TenantModule.entities],
            synchronize: true,
          });

          if (createdConnection) {
            next();
          } else {
            throw new BadRequestException(
              'Database Connection Error',
              'There is a Error with the Database!',
            );
          }
        }
      })
      .exclude('api/admin/(.*)')
      .forRoutes('api/(.*)');
  }
}
