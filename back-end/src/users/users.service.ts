import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superuser' | 'eventmanager' | 'client' | 'osc' | 'attendee';
  domain?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

@Injectable()
export class UsersService {

  private readFile(): User[] {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as User[];
    } catch {
      return [];
    }
  }

  private writeFile(users: User[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
  }

  private nextId(users: User[]): string {
    const nums = users
      .map((u) => parseInt(u.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `u${max + 1}`;
  }

  findAll(role?: string): User[] {
    const users = this.readFile();
    if (role) return users.filter((u) => u.role === role);
    return users;
  }

  findOne(id: string): User {
    const user = this.readFile().find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User "${id}" not found`);
    return user;
  }

  create(dto: any): User {
    const users = this.readFile();
    const existing = users.find((u) => u.email === dto.email);
    if (existing) throw new ConflictException(`Email "${dto.email}" already registered`);

    const newUser: User = {
      id: this.nextId(users),
      name: dto.name,
      email: dto.email,
      role: dto.role,
      domain: dto.domain,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.writeFile(users);
    return newUser;
  }

  update(id: string, dto: any): User {
    const users = this.readFile();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException(`User "${id}" not found`);
    users[index] = { ...users[index], ...dto, updatedAt: new Date().toISOString() };
    this.writeFile(users);
    return users[index];
  }

  remove(id: string): { message: string } {
    const users = this.readFile();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException(`User "${id}" not found`);
    users.splice(index, 1);
    this.writeFile(users);
    return { message: `User "${id}" deleted` };
  }

  getStats(): object {
    const users = this.readFile();
    return {
      total: users.length,
      superusers: users.filter((u) => u.role === 'superuser').length,
      eventManagers: users.filter((u) => u.role === 'eventmanager').length,
      clients: users.filter((u) => u.role === 'client').length,
      oscStaff: users.filter((u) => u.role === 'osc').length,
      attendees: users.filter((u) => u.role === 'attendee').length,
      active: users.filter((u) => u.status === 'active').length,
    };
  }
}
