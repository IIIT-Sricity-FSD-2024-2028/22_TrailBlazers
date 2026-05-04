import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PendingRequest {
  id: string;
  name: string;
  location: string;
  expected: number;
  client: string;
  clientEmail: string;
  date: string;
  description: string;
  type: 'In-Person' | 'Virtual' | 'Hybrid';
  status: 'Pending' | 'Approved' | 'Rejected';
  managerId?: string;
  managerName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'pending-requests.json');

@Injectable()
export class PendingRequestsService {

  private readFile(): PendingRequest[] {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as PendingRequest[];
    } catch {
      return [];
    }
  }

  private writeFile(requests: PendingRequest[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf-8');
  }

  private nextId(requests: PendingRequest[]): string {
    const nums = requests
      .map((r) => parseInt(r.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `pr${max + 1}`;
  }

  findAll(status?: string): PendingRequest[] {
    const requests = this.readFile();
    if (status) return requests.filter((r) => r.status === status);
    return requests;
  }

  findOne(id: string): PendingRequest {
    const req = this.readFile().find((r) => r.id === id);
    if (!req) throw new NotFoundException(`Request "${id}" not found`);
    return req;
  }

  create(dto: any): PendingRequest {
    const requests = this.readFile();
    const newReq: PendingRequest = {
      id: this.nextId(requests),
      ...dto,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    requests.push(newReq);
    this.writeFile(requests);
    return newReq;
  }

  review(id: string, dto: any): PendingRequest {
    const requests = this.readFile();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`Request "${id}" not found`);
    if (requests[index].status !== 'Pending') {
      throw new BadRequestException(`Request "${id}" has already been reviewed`);
    }

    if (dto.decision === 'approved') {
      if (!dto.managerId) throw new BadRequestException('managerId is required for approval');
      requests[index] = {
        ...requests[index],
        status: 'Approved',
        managerId: dto.managerId,
        managerName: dto.managerName,
        updatedAt: new Date().toISOString(),
      };
    } else {
      requests[index] = {
        ...requests[index],
        status: 'Rejected',
        rejectionReason: dto.rejectionReason || 'No reason provided',
        updatedAt: new Date().toISOString(),
      };
    }

    this.writeFile(requests);
    return requests[index];
  }

  remove(id: string): { message: string } {
    const requests = this.readFile();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) throw new NotFoundException(`Request "${id}" not found`);
    requests.splice(index, 1);
    this.writeFile(requests);
    return { message: `Request "${id}" deleted` };
  }
}
