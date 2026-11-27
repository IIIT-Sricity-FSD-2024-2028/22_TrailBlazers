import {
  Injectable,
  BadRequestException,
  NotFoundException,
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

    const isStaffRole = [
      'SUPER_ADMIN',
      'ADMIN',
      'DEPARTMENT_MANAGER',
      'EVENT_MANAGER',
      'REVENUE',
      'ONSITE_COORDINATOR',
      'IT_SUPPORT',
    ].includes(normalizedRole);

    let cleanEmail = email.toLowerCase().trim();
    if (isStaffRole) {
      if (!cleanEmail.endsWith('@wavevents.com')) {
        const localPart = cleanEmail.split('@')[0];
        cleanEmail = `${localPart}@wavevents.com`;
      }
    } else {
      if (cleanEmail.endsWith('@wavevents.com')) {
        const localPart = cleanEmail.split('@')[0];
        cleanEmail = `${localPart}@gmail.com`;
      }
    }

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

    let targetDept = department ? department.trim().toUpperCase() : null;
    if (normalizedRole === 'IT_SUPPORT') {
      targetDept = 'IT_SUPPORT';
    } else if (normalizedRole === 'REVENUE' && !targetDept) {
      targetDept = 'REVENUE';
    } else if ((normalizedRole === 'EVENT_MANAGER' || normalizedRole === 'ONSITE_COORDINATOR') && !targetDept) {
      targetDept = 'EVENT_MANAGEMENT';
    }

    // Restriction: Exactly ONE Department Head per department.
    // Prevent the creation or assignment of a second Department Head for the same department.
    if (normalizedRole === 'DEPARTMENT_MANAGER') {
      if (!targetDept) {
        throw new BadRequestException('A valid department must be specified when creating a Department Head.');
      }
      const existingHead = this.store.findOne<any>(
        'users',
        (u) =>
          (u.role || '').toUpperCase() === 'DEPARTMENT_MANAGER' &&
          (u.department || '').toUpperCase() === targetDept,
      );
      if (existingHead) {
        throw new ConflictException(
          `Department '${targetDept}' already has an assigned Department Head (${existingHead.name}). Only ONE Department Head is permitted per department.`,
        );
      }
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
      `User Management Provisioning: Account ${userId} (${cleanEmail}) created with role ${normalizedRole} in department ${targetDept || 'NONE'} by ${actorUser.email} (${actorRole})`,
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

  async updateUser(
    id: string,
    dto: { name?: string; email?: string; role?: string; department?: string; organization?: string; status?: string },
    actorUser: any,
  ) {
    const actorRole = (actorUser?.role || '').toUpperCase();
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'ADMIN' && actorRole !== 'DEPARTMENT_MANAGER') {
      throw new ForbiddenException('Unauthorized to update user accounts.');
    }

    const existingUser = this.store.findById<any>('users', id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    const patch: any = {};
    if (dto.name && dto.name.trim()) patch.name = dto.name.trim();
    if (dto.organization !== undefined) patch.organization = dto.organization ? dto.organization.trim() : null;

    const newRole = dto.role ? dto.role.trim().toUpperCase() : (existingUser.role || '').toUpperCase();
    const newDept = dto.department !== undefined ? (dto.department ? dto.department.trim().toUpperCase() : null) : (existingUser.department || null);

    if (dto.email && dto.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      let cleanEmail = dto.email.trim().toLowerCase();
      const isStaffRole = [
        'SUPER_ADMIN',
        'ADMIN',
        'DEPARTMENT_MANAGER',
        'EVENT_MANAGER',
        'REVENUE',
        'ONSITE_COORDINATOR',
        'IT_SUPPORT',
      ].includes(newRole);

      if (isStaffRole) {
        if (!cleanEmail.endsWith('@wavevents.com')) {
          const localPart = cleanEmail.split('@')[0];
          cleanEmail = `${localPart}@wavevents.com`;
        }
      } else {
        if (cleanEmail.endsWith('@wavevents.com')) {
          const localPart = cleanEmail.split('@')[0];
          cleanEmail = `${localPart}@gmail.com`;
        }
      }

      const duplicate = this.usersRepository.findByEmail(cleanEmail);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Email '${cleanEmail}' is already in use by another account.`);
      }
      patch.email = cleanEmail;
    }

    if (newRole && !VALID_ROLES.has(newRole)) {
      throw new BadRequestException(`Invalid role '${dto.role}'.`);
    }

    // Prevent creation or assignment of a second Department Head for the same department
    if (newRole === 'DEPARTMENT_MANAGER') {
      const targetDept = newDept || existingUser.department;
      if (!targetDept) {
        throw new BadRequestException('A Department must be specified for a Department Head.');
      }
      const existingHead = this.store.findOne<any>(
        'users',
        (u) =>
          u.id !== id &&
          (u.role || '').toUpperCase() === 'DEPARTMENT_MANAGER' &&
          (u.department || '').toUpperCase() === targetDept.toUpperCase(),
      );
      if (existingHead) {
        throw new ConflictException(
          `Department '${targetDept}' already has an assigned Department Head (${existingHead.name}). Only ONE Department Head is permitted per department.`,
        );
      }
    }

    if (dto.role) patch.role = newRole;
    if (dto.department !== undefined) patch.department = newDept;
    if (dto.status) patch.status = dto.status.trim().toUpperCase();

    const updated = this.store.update<any>('users', id, patch);
    return {
      message: 'User updated successfully.',
      user: this.usersRepository.findPublicById(id),
    };
  }

  async deleteUser(id: string, actorUser: any) {
    const actorRole = (actorUser?.role || '').toUpperCase();
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can remove user accounts.');
    }

    const user = this.store.findById<any>('users', id);
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    // Safety: Unassign user from event requests to avoid dangling relations
    const allRequests = this.store.findAll<any>('event_requests');
    for (const req of allRequests) {
      let reqUpdated = false;
      const patch: any = {};
      if (req.eventManagerUserId === id || req.assignedManagerUserId === id) {
        patch.eventManagerUserId = null;
        patch.assignedManagerUserId = null;
        patch.operationalStatus = 'AWAITING_ASSIGNMENT';
        reqUpdated = true;
      }
      if (req.onsiteCoordinatorUserId === id) {
        patch.onsiteCoordinatorUserId = null;
        reqUpdated = true;
      }
      if (Array.isArray(req.onsiteCoordinatorUserIds) && req.onsiteCoordinatorUserIds.includes(id)) {
        patch.onsiteCoordinatorUserIds = req.onsiteCoordinatorUserIds.filter((cid: string) => cid !== id);
        reqUpdated = true;
      }
      if (req.assignedRevenueUserId === id) {
        patch.assignedRevenueUserId = null;
        reqUpdated = true;
      }
      if (reqUpdated) {
        this.store.update<any>('event_requests', req.id, patch);
      }
    }

    // Safety: Unassign user from operational issues
    const allIssues = this.store.findAll<any>('event_operational_issues');
    for (const iss of allIssues) {
      if (iss.assignedUserId === id) {
        this.store.update<any>('event_operational_issues', iss.id, {
          assignedUserId: null,
          assignedUserName: null,
          status: 'OPEN',
        });
      }
    }

    // Delete user from store
    this.store.delete('users', id);
    this.logger.log(`User ${id} (${user.email}) deleted safely by ${actorUser.email}`, 'USERS_SERVICE');

    return {
      message: `User ${user.name} (${user.email}) removed successfully.`,
      deletedUserId: id,
    };
  }
}
