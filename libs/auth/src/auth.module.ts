import {
  DynamicModule,
  HttpModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  Provider,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '@lib/core';
import { authenticate } from 'passport';
import { AUTH_CONTROLLERS } from './controllers';
import { AUTH_ENTITIES } from './entities';
import { AUTH_SERVICES } from './services';
import {
  FacebookOption,
  GoogleOption,
  JwtOption,
} from './interfaces/auth-strategy-option';
import { AUTH_APP_FILTERS } from './filters';
import { AUTH_APP_GUARDS } from './guards';
import { FACEBOOK_CONFIG_TOKEN } from './configs/facebook.config';
import { GOOGLE_PLUS_CONFIG_TOKEN } from './configs/google-plus.config';
import { JWT_CONFIG_TOKEN } from './configs/jwt.config';
import { AUTH_CORE_TOKEN } from './configs/core.config';
import { AuthCoreOption } from './interfaces/auth-core.option';
import { LocalStrategySignUp } from './passport/local.strategy';
import { AUTH_PASSPORT_STRATEGIES } from './passport';
import { TenantModule } from '@lib/tenant';

@Module({})
export class AuthModule implements NestModule {
  static forRootAsync(
    fbConf: FacebookOption,
    ggConf: GoogleOption,
    jwtConf: JwtOption,
    authCoreConf: AuthCoreOption,
  ): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        HttpModule,
        CoreModule.forFeature(),
        TypeOrmModule.forFeature([...AUTH_ENTITIES]),
        ...fbConf.imports,
        ...ggConf.imports,
        ...jwtConf.imports,
        TenantModule,
      ],
      controllers: [...AUTH_CONTROLLERS],
      providers: [
        {
          provide: FACEBOOK_CONFIG_TOKEN,
          useFactory: fbConf.useFactory,
          inject: fbConf.inject,
        },
        {
          provide: GOOGLE_PLUS_CONFIG_TOKEN,
          useFactory: ggConf.useFactory,
          inject: ggConf.inject,
        },
        {
          provide: JWT_CONFIG_TOKEN,
          useFactory: jwtConf.useFactory,
          inject: jwtConf.inject,
        },
        {
          provide: AUTH_CORE_TOKEN,
          useFactory: jwtConf.useFactory,
          inject: jwtConf.inject,
        },
        ...AUTH_SERVICES,
        ...AUTH_APP_GUARDS,
        ...AUTH_APP_FILTERS,
        ...AUTH_PASSPORT_STRATEGIES,
      ],
      exports: [...AUTH_SERVICES],
    };
  }

  static forFeature(options?: { providers: Provider[] }): DynamicModule {
    const providers = options && options.providers ? options.providers : [];
    return {
      module: AuthModule,
      imports: [
        HttpModule,
        CoreModule.forFeature(options),
        TypeOrmModule.forFeature([...AUTH_ENTITIES]),
        TenantModule,
      ],
      providers: [
        ...providers,
        ...AUTH_SERVICES,
        ...AUTH_APP_GUARDS,
        ...AUTH_APP_FILTERS,
        ...AUTH_PASSPORT_STRATEGIES,
      ],
      exports: [...AUTH_SERVICES],
    };
  }
  static forRoot(options?: { providers: Provider[] }): DynamicModule {
    const providers = options && options.providers ? options.providers : [];
    return {
      module: AuthModule,
      imports: [
        HttpModule,
        CoreModule.forFeature(options),
        TypeOrmModule.forFeature([...AUTH_ENTITIES]),
        TenantModule,
      ],
      controllers: [...AUTH_CONTROLLERS],
      providers: [
        ...providers,
        ...AUTH_SERVICES,
        ...AUTH_APP_GUARDS,
        ...AUTH_APP_FILTERS,
        ...AUTH_PASSPORT_STRATEGIES,
      ],
      exports: [...AUTH_SERVICES],
    };
  }

  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        authenticate('signup', { session: false, passReqToCallback: true }),
      )
      .forRoutes('auth/signup');
    consumer
      .apply(
        authenticate('signin', { session: false, passReqToCallback: true }),
      )
      .forRoutes('auth/signin');
    consumer
      .apply(
        authenticate('facebook', { session: false, passReqToCallback: true }),
      )
      .forRoutes('auth/facebook/token');
    consumer
      .apply(
        authenticate('google', { session: false, passReqToCallback: true }),
      )
      .forRoutes('auth/google-plus/token');
  }
}
