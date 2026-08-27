import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersRepository } from '../../repositories/users.repository';
import { VALID_ROLES } from '../../common/guards/header-role.guard';
import { NestLoggerService } from '../../common/logging/logger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InMemoryStore } from '../../repositories/in-memory.store';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  getAllUsers() {
    const users = this.store.findAll<any>('users').map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      organization: u.organization || null,
      department: u.department || null,
      emailVerified: Boolean(u.emailVerified),
      createdAt: u.createdAt,
    }));
    return { users };
  }

  async createUser(dto: CreateUserDto, actorUser: any) {
    const { name, email, role, organization, department, password } = dto;

    const normalizedRole = (role || '').trim().toUpperCase();

    if (!VALID_ROLES.has(normalizedRole)) {
      throw new BadRequestException(
        `Invalid role '${role}'. Allowed roles are: ${Array.from(VALID_ROLES).join(', ')}`,
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = this.usersRepository.findByEmail(cleanEmail);
    if (existing) {
      throw new ConflictException(
        `An account with email '${cleanEmail}' already exists in the system.`,
      );
    }

    const initialPassword = password && password.trim().length >= 6
      ? password.trim()
      : `Wave_${crypto.randomBytes(4).toString('hex')}!2026`;

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

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
    if (department) {
      this.store.update<any>('users', userId, { department: department.trim() });
    }

    const updatedUser = this.usersRepository.findPublicById(userId);

    this.logger.log(
      `IT Support User Creation: Account ${userId} (${cleanEmail}) created with role ${normalizedRole} by ${actorUser.email}`,
      'USERS_SERVICE',
    );

    return {
      message: `User account for ${name} created successfully with role ${normalizedRole}.`,
      user: updatedUser,
      initialPassword,
    };
  }
}
