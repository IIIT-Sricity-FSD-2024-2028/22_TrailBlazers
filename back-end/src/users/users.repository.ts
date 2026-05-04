import { Injectable } from '@nestjs/common';

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

@Injectable()
export class UsersRepository {
  private users: User[] = [
    { id: 'u1', name: 'Admin Root', email: 'admin@wevents.com', role: 'superuser', domain: 'Platform Administration', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'u2', name: 'Rajesh Kumar', email: 'rajesh@gmail.com', role: 'eventmanager', domain: 'Client Hosted Events', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'u3', name: 'Arjun Mehta', email: 'arjun@gmail.com', role: 'eventmanager', domain: 'Tech Conferences', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'u4', name: 'Kavya Iyer', email: 'kavya@gmail.com', role: 'client', domain: 'Marketing Events', status: 'active', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
    { id: 'u5', name: 'Ritu Sharma', email: 'ritu@gmail.com', role: 'client', domain: 'Corporate Events', status: 'active', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
    { id: 'u6', name: 'Rahul Sharma', email: 'rahul.s@gmail.com', role: 'attendee', status: 'active', createdAt: '2026-01-05T00:00:00.000Z', updatedAt: '2026-01-05T00:00:00.000Z' },
    { id: 'u7', name: 'Priya Patel', email: 'priya.p@gmail.com', role: 'attendee', status: 'active', createdAt: '2026-01-05T00:00:00.000Z', updatedAt: '2026-01-05T00:00:00.000Z' },
    { id: 'u8', name: 'Alex Thompson', email: 'alex.t@wevents.com', role: 'osc', status: 'active', createdAt: '2026-01-10T00:00:00.000Z', updatedAt: '2026-01-10T00:00:00.000Z' },
    { id: 'u9', name: 'Sujith R', email: 'sujith.r@wevents.com', role: 'osc', status: 'active', createdAt: '2026-01-10T00:00:00.000Z', updatedAt: '2026-01-10T00:00:00.000Z' },
    { id: 'u10', name: 'Suhaas', email: 'SuhaasB@gmail.com', role: 'eventmanager', domain: 'Innovation Tech', status: 'active', createdAt: '2026-05-03T05:02:53.462Z', updatedAt: '2026-05-03T05:02:53.462Z' },
    { id: 'u11', name: 'Tharun', email: 'Tharun@gmail.com', role: 'eventmanager', domain: 'Innovation Tech', status: 'active', createdAt: '2026-05-03T05:07:20.562Z', updatedAt: '2026-05-03T05:07:20.562Z' },
  ];

  private nextId(): string {
    const nums = this.users
      .map((u) => parseInt(u.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `u${max + 1}`;
  }

  findAll(role?: string): User[] {
    if (role) return this.users.filter((u) => u.role === role);
    return [...this.users];
  }

  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  save(data: Partial<User> & { id?: string }): User {
    const index = this.users.findIndex((u) => u.id === data.id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...data, updatedAt: new Date().toISOString() };
      return this.users[index];
    }
    const newUser: User = {
      id: this.nextId(),
      name: data.name!,
      email: data.email!,
      role: data.role!,
      domain: data.domain,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  delete(id: string): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
}
