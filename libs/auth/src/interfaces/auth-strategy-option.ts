import { ModuleMetadata } from '@nestjs/common';
import { IFacebookConfig } from './facebook-config.interface';
import { IGooglePlusConfig } from './google-plus-config.interface';
import { IJwtConfig } from './jwt-config.interface';

export interface FacebookOption extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => IFacebookConfig;
}

export interface GoogleOption extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => IGooglePlusConfig;
}

export interface JwtOption extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory: (...args: any[]) => IJwtConfig;
}
