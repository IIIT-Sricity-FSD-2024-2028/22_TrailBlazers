import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VALID_ROLES } from './header-role.guard';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const roleHeader = req.headers['x-role'] || req.headers['x-user-role'];

    // 1. JWT Bearer token authentication (takes precedence if user is authenticated)
    if (user && !err) {
      req.user = user;
      return user;
    }

    // 2. Header-based evaluation path (x-role / x-user-role) for dev testing fallback
    if (roleHeader) {
      const normalizedRole = String(roleHeader).trim().toUpperCase();

      if (!VALID_ROLES.has(normalizedRole)) {
        throw new ForbiddenException(
          `Invalid role specified in header: '${roleHeader}'. Allowed roles are: ${Array.from(VALID_ROLES).join(', ')}`,
        );
      }

      const evalUser = {
        id: `eval_${normalizedRole.toLowerCase()}_id`,
        email: `eval_${normalizedRole.toLowerCase()}@wavevents.com`,
        name: `${normalizedRole} Evaluation User`,
        role: normalizedRole,
        department: null,
        emailVerified: true,
        organization: null,
        isHeaderEval: true,
      };

      req.user = evalUser;
      return evalUser;
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException(
        'Authentication required. Provide x-role header or Bearer token.',
      );
    }
    throw new ForbiddenException(
      'Session expired or invalid token. Please sign in again.',
    );
  }
}
