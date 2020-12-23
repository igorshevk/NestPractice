import { IFacebookConfig, IGooglePlusConfig, IJwtConfig } from '@lib/auth';
import { ICoreConfig } from '@lib/core';
import { Provider } from '@nestjs/common';

export interface IConfig {
  core: ICoreConfig;
  auth: {
    fbConf: IFacebookConfig;
    ggConf: IGooglePlusConfig;
    jwtConf: IJwtConfig;
  };
}
