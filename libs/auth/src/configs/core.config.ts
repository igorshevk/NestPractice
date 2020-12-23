import { IAuthCoreConfig } from '../interfaces/auth-core.interface';
import { IFacebookConfig } from '../interfaces/facebook-config.interface';

export const DEFAULT_AUTH_CORE_CONFIG: IAuthCoreConfig = {
  port: 3000,
  protocol: 'https',
};
export const AUTH_CORE_TOKEN = 'AuthCoreConfig';
