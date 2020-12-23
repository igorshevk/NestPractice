import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { GroupsService, User } from '@lib/core';
import { plainToClass } from 'class-transformer';
import { Strategy } from 'passport-jwt';
import { IJwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenService } from '../services/token.service';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private moduleRef: ModuleRef,
    private readonly tokenService: TokenService,
  ) {
    super({
      passReqToCallback: true,
      jwtFromRequest: req => {
        const token = this.tokenService.extractTokenFromRequest(req);
        // Logger.log(token, JwtStrategy.name);
        return token;
      },
      secretOrKeyProvider: (req, token, done) => {
        const secretKey = this.tokenService.createSecretKey(
          plainToClass(User, this.tokenService.decode(token)),
        );
        done(null, secretKey);
      },
    });
  }

  public async validate(req, payload: IJwtPayload) {
    const contextId = ContextIdFactory.getByRequest(req);
    this.moduleRef.registerRequestByContextId(req, contextId);
    const groupsService = await this.moduleRef.resolve(
      GroupsService,
      contextId,
      { strict: false },
    );

    try {
      await groupsService.preloadAll();
    } catch (error) {
      throw new BadRequestException('Error in load groups');
    }
    try {
      // Logger.log(JSON.stringify(payload), JwtStrategy.name);
      // const { user } = await this.userService.findById({ id: payload.id });
      const user = plainToClass(User, payload);
      user.groups = user.groups.map(group =>
        groupsService.getGroupByName({ name: group.name }),
      );
      // Logger.log(JSON.stringify(user), JwtStrategy.name);
      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
