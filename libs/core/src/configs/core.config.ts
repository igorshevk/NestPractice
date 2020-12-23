import { ICoreConfig } from '../interfaces/core-config.interface';

export const DEFAULT_CORE_CONFIG: ICoreConfig = {
  demo: false,
  port: 3000,
  protocol: 'http',
  domain: 'localhost',
};
export const CORE_CONFIG_TOKEN = 'CoreConfigToken';
