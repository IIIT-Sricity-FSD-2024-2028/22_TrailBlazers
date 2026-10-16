import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { UsersRepository } from "../../repositories/users.repository";
import { VALID_ROLES } from "../../common/guards/header-role.guard";
import { NestLoggerService } from "../../common/logging/logger.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { InMemoryStore } from "../../repositories/in-memory.store";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  getAllUsers(actorUser: any) {
    const actorRole = (actorUser?.role || '').toUpperCase();
    const actorDept = (actorUser?.department || '').toUpperCase();

    // Enforce Department Manager authorization: Only IT_SUPPORT department manager can access
    if (actorRole === 'DEPARTMENT_MANAGER' && actorDept !== 'IT_SUPPORT') {
      throw new ForbiddenException(
        'Department Managers outside the IT Support department are not authorized to access User Management.',
      );
    }

    const allUsers = this.store.findAll<any>('users');

    // Filter users according to authorized role scope
    let scopedUsers: any[] = [];
    if (actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN') {
      scopedUsers = allUsers;
    } else if (actorRole === 'DEPARTMENT_MANAGER' && actorDept === 'IT_SUPPORT') {
      // IT Support Department Head can view:
      // 1. All IT Support department members and IT Support role accounts
      // 2. Operational & public accounts: CLIENT, ATTENDEE, SPEAKER, EVENT_MANAGER, ONSITE_COORDINATOR, REVENUE
      // Cannot view: SUPER_ADMIN, ADMIN, or other Department Managers (except self)
      scopedUsers = allUsers.filter((u) => {
        const uRole = (u.role || '').toUpperCase();
        const uDept = (u.department || '').toUpperCase();
        if (u.id === actorUser.id) return true;
        if (uRole === 'SUPER_ADMIN' || uRole === 'ADMIN') return false;
        if (uRole === 'DEPARTMENT_MANAGER' && uDept !== 'IT_SUPPORT') return false;
        return true;
      });
    } else if (actorRole === 'IT_SUPPORT') {
      // IT Support specialist can view:
      // Operational accounts (CLIENT, ATTENDEE, SPEAKER, EVENT_MANAGER, ONSITE_COORDINATOR, REVENUE) and IT Support peers
      // Cannot view: SUPER_ADMIN, ADMIN, DEPARTMENT_MANAGER
      scopedUsers = allUsers.filter((u) => {
        const uRole = (u.role || '').toUpperCase();
        if (
          uRole === 'SUPER_ADMIN' ||
          uRole === 'ADMIN' ||
          uRole === 'DEPARTMENT_MANAGER'
        ) {
          return false;
        }
        return true;
      });
    } else {
      throw new ForbiddenException(
        'You are not authorized to view the user management directory.',
      );
    }

    const users = scopedUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role || '').toUpperCase(),
      organization: u.organization || null,
      department: u.department || null,
      emailVerified: Boolean(u.emailVerified),
      status: u.status || (u.emailVerified ? 'ACTIVE' : 'INACTIVE'),
      createdAt: u.createdAt || null,
    }));

    return { users, total: users.length };
  }

  practiceTotalUsers() {
    return this.usersRepository.findEventmanager();
  }

  async createUser(dto: CreateUserDto, actorUser: any) {
    const actorRole = (actorUser?.role || '').toUpperCase();
    const actorDept = (actorUser?.department || '').toUpperCase();

    if (actorRole === 'DEPARTMENT_MANAGER' && actorDept !== 'IT_SUPPORT') {
      throw new ForbiddenException(
        'Department Managers outside the IT Support department are not authorized to provision user accounts.',
      );
    }

    const { name, email, role, organization, department, password } = dto;
    const normalizedRole = (role || '').trim().toUpperCase();

    if (!VALID_ROLES.has(normalizedRole)) {
      throw new BadRequestException(
        `Invalid role '${role}'. Allowed roles are: ${Array.from(VALID_ROLES).join(', ')}`,
      );
    }

    // Role-Based Access Control on target role creation
    if (actorRole === 'IT_SUPPORT') {
      const allowedForITSupport = new Set([
        'CLIENT',
        'ATTENDEE',
        'SPEAKER',
        'EVENT_MANAGER',
        'ONSITE_COORDINATOR',
      ]);
      if (!allowedForITSupport.has(normalizedRole)) {
        throw new ForbiddenException(
          `IT Support Specialists are not authorized to create accounts with role '${normalizedRole}'.`,
        );
      }
    } else if (actorRole === 'DEPARTMENT_MANAGER' && actorDept === 'IT_SUPPORT') {
      const allowedForITManager = new Set([
        'CLIENT',
        'ATTENDEE',
        'SPEAKER',
        'EVENT_MANAGER',
        'ONSITE_COORDINATOR',
        'IT_SUPPORT',
      ]);
      if (!allowedForITManager.has(normalizedRole)) {
        throw new ForbiddenException(
          `IT Support Department Managers cannot create accounts with privileged role '${normalizedRole}'.`,
        );
      }
    } else if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'ADMIN') {
      throw new ForbiddenException('Unauthorized to create user accounts.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = this.usersRepository.findByEmail(cleanEmail);
    if (existing) {
      throw new ConflictException(
        `An account with email '${cleanEmail}' already exists in the system.`,
      );
    }

    const initialPassword =
      password && password.trim().length >= 6
        ? password.trim()
        : `Wave_${crypto.randomBytes(4).toString('hex')}!2026`;

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    let targetDept = department ? department.trim() : null;
    if (normalizedRole === 'IT_SUPPORT') {
      targetDept = 'IT_SUPPORT';
    }

    const createdUser = this.usersRepository.createUser({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: normalizedRole,
      organization: organization ? organization.trim() : null,
      verificationCode,
    });

    if (!createdUser) {
      throw new BadRequestException('Failed to create user account.');
    }

    // Auto verify email for staff/system created users
    this.usersRepository.updateEmailVerified(userId);
    if (targetDept) {
      this.store.update<any>('users', userId, {
        department: targetDept,
      });
    }

    const updatedUser = this.usersRepository.findPublicById(userId);

    this.logger.log(
      `User Management Provisioning: Account ${userId} (${cleanEmail}) created with role ${normalizedRole} by ${actorUser.email} (${actorRole})`,
      'USERS_SERVICE',
    );

    return {
      message: `User account for ${name.trim()} created successfully with role ${normalizedRole}.`,
      user: {
        ...updatedUser,
        status: 'ACTIVE',
      },
      initialPassword,
    };
  }
}
