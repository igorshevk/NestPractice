import { ModuleMetadata } from '@nestjs/common';
import { IAuthCoreConfig } from './auth-core.interface';

export interface AuthCoreOption extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => IAuthCoreConfig;
}
