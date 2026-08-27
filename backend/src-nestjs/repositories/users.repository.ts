import { Injectable } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { NestLoggerService } from '../common/logging/logger.service';

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  organization: string | null;
  emailVerified: number;
  verificationCode: string | null;
  department: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicUserEntity {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  organization: string | null;
  emailVerified: boolean;
  verificationCode: string | null;
}

@Injectable()
export class UsersRepository {
  constructor(
    private readonly store: InMemoryStore,
    private readonly logger: NestLoggerService,
  ) {}

  findByEmail(email: string): UserEntity | null {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    return this.store.findOne<UserEntity>(
      'users',
      (u) => (u.email || '').toLowerCase().trim() === cleanEmail,
    );
  }

  findById(id: string): UserEntity | null {
    if (!id) return null;
    return this.store.findById<UserEntity>('users', id);
  }

  findPublicById(id: string): PublicUserEntity | null {
    if (!id) return null;
    const row = this.findById(id);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department || null,
      organization: row.organization || null,
      emailVerified: Boolean(row.emailVerified),
      verificationCode: row.verificationCode || null,
    };
  }

  createUser(params: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role?: string;
    organization?: string | null;
    verificationCode: string;
  }): PublicUserEntity | null {
    const role = params.role || 'ATTENDEE';
    const cleanEmail = params.email.toLowerCase().trim();
    const cleanName = params.name.trim();

    const newUser: UserEntity = {
      id: params.id,
      name: cleanName,
      email: cleanEmail,
      passwordHash: params.passwordHash,
      role,
      organization: params.organization || null,
      emailVerified: 0,
      verificationCode: params.verificationCode,
      department: null,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.store.create('users', newUser);
    this.logger.log(`New user created in memory: ${params.id} (${cleanEmail})`, 'USER_REPOSITORY');

    return this.findPublicById(params.id);
  }

  updateEmailVerified(userId: string): PublicUserEntity | null {
    this.store.update<UserEntity>('users', userId, {
      emailVerified: 1,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    return this.findPublicById(userId);
  }
}
