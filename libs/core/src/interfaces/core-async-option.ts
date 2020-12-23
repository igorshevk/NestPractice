import { ModuleMetadata } from '@nestjs/common';
import { ICoreConfig } from './core-config.interface';

export interface CoreOption extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => ICoreConfig;
}
