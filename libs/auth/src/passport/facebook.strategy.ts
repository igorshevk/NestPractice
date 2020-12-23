import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { plainToClass } from 'class-transformer';
import { use } from 'passport';
import * as FacebookTokenStrategy from 'passport-facebook-token';
import { FACEBOOK_CONFIG_TOKEN } from '../configs/facebook.config';
import { SignUpDto } from '../dto/sign-up.dto';
import { OauthTokensAccesstoken } from '../entities/oauth-tokens-accesstoken.entity';
import { IFacebookConfig } from '../interfaces/facebook-config.interface';
import { AuthService } from '../services/auth.service';
import { OauthTokensAccesstokensService } from '../services/oauth-tokens-accesstokens.service';

// TODO because cannot test yet
@Injectable()
export class FacebookStrategy {
  private readonly oauthTokensAccesstokensService: OauthTokensAccesstokensService;
  private readonly authService: AuthService;

  constructor(
    @Inject(FACEBOOK_CONFIG_TOKEN) private readonly fbConfig: IFacebookConfig,
    private moduleRef: ModuleRef,
  ) {
    this.init();
  }

  private init(): void {
    use(
      'facebook',
      new FacebookTokenStrategy(
        {
          clientID: this.fbConfig.client_id,
          clientSecret: this.fbConfig.client_secret,
          // _passReqToCallback: true
        },
        async (
          // req,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done,
        ) => {
          // Logger.log(JSON.stringify(profile), FacebookStrategy.name);
          if (!profile.id) {
            done(null, null);
          }
          try {
            try {
              const {
                oauthTokensAccesstoken,
              } = await this.oauthTokensAccesstokensService.findByProviderClientId(
                {
                  id: profile.id,
                },
              );
              const { user } = await this.authService.info({
                id: oauthTokensAccesstoken.user.id,
              });
              done(null, user);
            } catch (err) {
              const email =
                profile.emails &&
                profile.emails.length &&
                profile.emails[0].value
                  ? profile.emails[0].value
                  : `${profile.id}@facebook.com`;
              const username = `facebook_${profile.id}`;
              const firstName = profile.name.givenName;
              const lastName = profile.name.familyName;
              const password = `facebook_${profile.id}`;
              const { user } = await this.authService.signUp(
                plainToClass(SignUpDto, {
                  email,
                  username,
                  password,
                  firstName,
                  lastName,
                }),
              );
              const newOauthTokensAccesstoken = new OauthTokensAccesstoken();
              newOauthTokensAccesstoken.user = user;
              newOauthTokensAccesstoken.providerClientId = profile.id;
              newOauthTokensAccesstoken.provider = profile.provider;
              newOauthTokensAccesstoken.accessToken = accessToken;
              await this.oauthTokensAccesstokensService.create({
                item: newOauthTokensAccesstoken,
              });
              done(null, user);
            }
          } catch (err) {
            done(err, null);
          }
        },
      ),
    );
  }
}
