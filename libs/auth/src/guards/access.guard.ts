import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@lib/core';

@Injectable()
export class AccessGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    try {
      await super.canActivate(context);
    } catch (error) {
      Logger.error('Error in canActivate', error.message, AccessGuard.name);
    }
    // TODO check if and or or for class and hander
    const roles = [
      ...(this.reflector.get<string[]>('roles', context.getHandler()) || []),
      ...(this.reflector.get<string[]>('roles', context.getClass()) || []),
    ];
    const permissions = [
      ...(this.reflector.get<string[]>('permissions', context.getHandler()) ||
        []),
      ...(this.reflector.get<string[]>('permissions', context.getClass()) ||
        []),
    ];
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    // Logger.log(JSON.stringify(user), AccessGuard.name);
    const hasRole =
      roles.length > 0
        ? roles.filter(
            roleName => user && user instanceof User && user[roleName],
          ).length > 0
        : null;
    const hasPermission =
      permissions.length > 0
        ? user && user instanceof User && user.checkPermissions(permissions)
        : null;

    return (
      hasRole === true ||
      hasPermission === true ||
      (hasRole === null && hasPermission === null)
    );
  }
}
