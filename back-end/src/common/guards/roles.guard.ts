import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const role = request.headers['role'] as string;

    if (!role) {
      throw new UnauthorizedException(
        'Missing "role" header. Pass one of: superuser, eventmanager, client, osc, attendee',
      );
    }

    const validRoles = Object.values(Role);
    if (!validRoles.includes(role as Role)) {
      throw new UnauthorizedException(
        `Invalid role "${role}". Valid roles: ${validRoles.join(', ')}`,
      );
    }

    // SUPERUSER has top-of-hierarchy privileges — bypasses all role restrictions
    if (role === Role.SUPERUSER) {
      return true;
    }

    if (!requiredRoles.includes(role as Role)) {
      throw new ForbiddenException(
        `Role "${role}" is not authorized for this action. Required: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
