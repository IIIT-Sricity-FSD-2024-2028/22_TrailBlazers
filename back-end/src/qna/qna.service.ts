import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface QnAItem {
  id: string;
  eventId: string;
  question: string;
  askedBy: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  status: 'unanswered' | 'answered';
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'qna.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

@Injectable()
export class QnaService {

  private readFile(): QnAItem[] {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as QnAItem[];
    } catch {
      return [];
    }
  }

  private writeFile(items: QnAItem[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
  }

  private nextId(items: QnAItem[]): string {
    const nums = items
      .map((q) => parseInt(q.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `qna${max + 1}`;
  }

  /** Validate that an email exists in users.json */
  private validateEmail(email: string): void {
    try {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as Array<{ email: string }>;
      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        throw new BadRequestException(`Email "${email}" is not registered in the system`);
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
    }
  }

  findAll(eventId?: string, status?: string): QnAItem[] {
    let result = this.readFile();
    if (eventId) result = result.filter((q) => q.eventId === eventId);
    if (status) result = result.filter((q) => q.status === status);
    return result;
  }

  findOne(id: string): QnAItem {
    const item = this.readFile().find((q) => q.id === id);
    if (!item) throw new NotFoundException(`Q&A item "${id}" not found`);
    return item;
  }

  findByAttendee(email: string): QnAItem[] {
    this.validateEmail(email);
    return this.readFile().filter((q) => q.askedBy === email);
  }

  create(dto: any): QnAItem {
    // Note: email validation is intentionally relaxed — attendees with any email can ask questions
    const items = this.readFile();
    const newItem: QnAItem = {
      id: this.nextId(items),
      eventId: dto.eventId || 'e1',
      question: dto.question,
      askedBy: dto.askedBy || 'guest@wevents.com',
      status: 'unanswered',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newItem);   // insert at top so newest appears first
    this.writeFile(items);
    return newItem;
  }

  answer(id: string, dto: any): QnAItem {
    const items = this.readFile();
    const index = items.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException(`Q&A item "${id}" not found`);

    items[index] = {
      ...items[index],
      answer: dto.answer,
      answeredBy: dto.answeredBy,
      answeredAt: new Date().toISOString(),
      status: 'answered',
      updatedAt: new Date().toISOString(),
    };
    this.writeFile(items);
    return items[index];
  }

  update(id: string, dto: any): QnAItem {
    const items = this.readFile();
    const index = items.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException(`Q&A item "${id}" not found`);
    items[index] = { ...items[index], ...dto, updatedAt: new Date().toISOString() };
    this.writeFile(items);
    return items[index];
  }

  remove(id: string): { message: string } {
    const items = this.readFile();
    const index = items.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException(`Q&A item "${id}" not found`);
    items.splice(index, 1);
    this.writeFile(items);
    return { message: `Q&A item "${id}" deleted` };
  }

  getStats(eventId: string): object {
    const items = this.readFile().filter((q) => q.eventId === eventId);
    return {
      eventId,
      total: items.length,
      answered: items.filter((q) => q.status === 'answered').length,
      unanswered: items.filter((q) => q.status === 'unanswered').length,
    };
  }
}
