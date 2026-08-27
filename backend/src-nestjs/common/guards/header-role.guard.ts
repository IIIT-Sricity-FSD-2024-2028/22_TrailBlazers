import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InMemoryStore } from '../../repositories/in-memory.store';

export const VALID_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'EVENT_MANAGER',
  'CLIENT',
  'ONSITE_COORDINATOR',
  'ATTENDEE',
  'IT_SUPPORT',
  'REVENUE',
  'DEPARTMENT_MANAGER',
  'SPEAKER',
]);

@Injectable()
export class HeaderRoleGuard implements CanActivate {
  constructor(private readonly store?: InMemoryStore) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roleHeader = req.headers['x-role'] || req.headers['x-user-role'];

    if (!roleHeader) {
      throw new UnauthorizedException('Role header is required. Provide x-role.');
    }

    const normalizedRole = String(roleHeader).trim().toUpperCase();

    if (!VALID_ROLES.has(normalizedRole)) {
      throw new ForbiddenException(
        `Invalid role specified in header: '${roleHeader}'. Allowed roles are: ${Array.from(VALID_ROLES).join(', ')}`,
      );
    }

    // Attempt to lookup seeded user matching the requested role for robust user ID resolution
    let seededUser: any = null;
    if (this.store) {
      try {
        seededUser = this.store.findOne('users', (u: any) => u.role === normalizedRole);
      } catch (e) {
        // Fallback if store is uninitialized
      }
    }

    req.user = {
      id: seededUser ? seededUser.id : `eval_${normalizedRole.toLowerCase()}_id`,
      email: seededUser ? seededUser.email : `eval_${normalizedRole.toLowerCase()}@wavevents.com`,
      name: seededUser ? seededUser.name : `${normalizedRole} Evaluation User`,
      role: normalizedRole,
      department: seededUser ? seededUser.department || null : null,
      emailVerified: true,
      organization: seededUser ? seededUser.organization || null : null,
      isHeaderEval: true,
    };

    return true;
  }
}
