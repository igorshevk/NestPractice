import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@lib/core';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';

@Injectable()
export class LocalStrategySignIn extends PassportStrategy(Strategy, 'signin') {
  constructor(private moduleRef: ModuleRef) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  private async getAuthService(contextId): Promise<AuthService> {
    return this.moduleRef.resolve(AuthService, contextId);
  }

  public async validate(req, email: string, password: string) {
    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId(req, contextId);
    const authService = await this.getAuthService(contextId);

    const { user }: { user: User } = await authService.signIn({
      email,
      password,
    });
    return user;
  }
}
// tslint:disable-next-line:max-classes-per-file
@Injectable()
export class LocalStrategySignUp extends PassportStrategy(Strategy, 'signup') {
  constructor(private moduleRef: ModuleRef) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  private async getAuthService(contextId): Promise<AuthService> {
    return this.moduleRef.resolve(AuthService, contextId);
  }

  public async validate(req, email: string, password: string) {
    if (req.user) {
      return req.user;
    }

    const contextId = ContextIdFactory.getByRequest(req);
    this.moduleRef.registerRequestByContextId(req, contextId);
    const authService = await this.getAuthService(contextId);

    const { user } = await authService.signUp({
      email,
      password,
      username: req.body.username,
    });
    return user;
  }
}
