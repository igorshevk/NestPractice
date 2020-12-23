import {
  AUTH_APP_FILTERS,
  AUTH_APP_GUARDS,
  AUTH_PASSPORT_STRATEGIES,
  DEFAULT_FACEBOOK_CONFIG,
  DEFAULT_GOOGLE_PLUS_CONFIG,
  DEFAULT_JWT_CONFIG,
  FACEBOOK_CONFIG_TOKEN,
  GOOGLE_PLUS_CONFIG_TOKEN,
  JWT_CONFIG_TOKEN,
} from '@lib/auth';
import {
  CORE_APP_FILTERS,
  CORE_APP_PIPES,
  CORE_CONFIG_TOKEN,
  DEFAULT_CORE_CONFIG,
} from '@lib/core';
import { IConfig } from './auth-core.interface';

export default (): IConfig => ({
  core: {
    ...DEFAULT_CORE_CONFIG,
    demo: false,
  },
  auth: {
    jwtConf: {
      ...DEFAULT_JWT_CONFIG,
      authHeaderPrefix: process.env.JWT_AUTH_HEADER_PREFIX || 'Bearer',
      expirationDelta: process.env.JWT_EXPIRATION_DELTA || '7 days',
      secretKey: process.env.JWT_SECRET_KEY || 'secret_key',
    },
    fbConf: {
      ...DEFAULT_FACEBOOK_CONFIG,
      client_id: process.env.FACEBOOK_CLIENT_ID || 'none',
      client_secret: process.env.FACEBOOK_CLIENT_SECRET || 'none',
      oauth_redirect_uri: process.env.FACEBOOK_OAUTH_REDIRECT_URI || 'none',
    },
    ggConf: {
      ...DEFAULT_GOOGLE_PLUS_CONFIG,
      client_id: process.env.GOOGLE_CLIENT_ID || 'none',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || 'none',
      oauth_redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'none',
    },
  },
});
