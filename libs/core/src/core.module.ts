import { TenantModule } from '@lib/tenant';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CORE_CONFIG_TOKEN } from './configs/core.config';
import { CORE_CONTROLLERS } from './controllers';
import { CORE_ENTITIES } from './entities';
import { CORE_APP_FILTERS } from './filters';
import { CoreOption } from './interfaces/core-async-option';
import { CORE_APP_PIPES } from './pipes';
import { CORE_SERVICES } from './services';

@Module({
  imports: [TenantModule],
  exports: [...CORE_SERVICES],
})
export class CoreModule {
  static forRootAsync(coreConf: CoreOption): DynamicModule {
    return {
      module: CoreModule,
      imports: [
        TypeOrmModule.forFeature([...CORE_ENTITIES]),
        ...coreConf.imports,
      ],
      controllers: [...CORE_CONTROLLERS],
      providers: [
        {
          provide: CORE_CONFIG_TOKEN,
          useFactory: coreConf.useFactory,
          inject: coreConf.inject,
        },
        ...CORE_SERVICES,
        ...CORE_APP_FILTERS,
        ...CORE_APP_PIPES,
      ],
      global: true,
    };
  }

  static forFeature(options?: { providers: Provider[] }): DynamicModule {
    const providers = options && options.providers ? options.providers : [];
    return {
      module: CoreModule,
      imports: [TypeOrmModule.forFeature([...CORE_ENTITIES])],
      providers: [...CORE_SERVICES],
    };
  }

  static forRoot(options?: { providers: Provider[] }): DynamicModule {
    const providers = options && options.providers ? options.providers : [];
    return {
      module: CoreModule,
      imports: [TypeOrmModule.forFeature([...CORE_ENTITIES])],
      controllers: [...CORE_CONTROLLERS],
      providers: [
        ...providers,
        ...CORE_SERVICES,
        ...CORE_APP_FILTERS,
        ...CORE_APP_PIPES,
      ],
    };
  }
}
