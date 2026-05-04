import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PollOption {
  label: string;
  votes: number;
  voters: string[];
}

export interface Poll {
  id: string;
  eventId: string;
  question: string;
  options: PollOption[];
  status: 'open' | 'closed';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'polls.json');

@Injectable()
export class PollsService {

  private readFile(): Poll[] {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Poll[];
    } catch {
      return [];
    }
  }

  private writeFile(polls: Poll[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(polls, null, 2), 'utf-8');
  }

  private nextId(polls: Poll[]): string {
    const nums = polls
      .map((p) => parseInt(p.id.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `poll${max + 1}`;
  }

  findAll(eventId?: string, status?: string): Poll[] {
    let result = this.readFile();
    if (eventId) result = result.filter((p) => p.eventId === eventId);
    if (status) result = result.filter((p) => p.status === status);
    return result;
  }

  findOne(id: string): Poll {
    const poll = this.readFile().find((p) => p.id === id);
    if (!poll) throw new NotFoundException(`Poll "${id}" not found`);
    return poll;
  }

  findByEvent(eventId: string): Poll[] {
    return this.readFile().filter((p) => p.eventId === eventId);
  }

  create(dto: any): Poll {
    const polls = this.readFile();
    const newPoll: Poll = {
      id: this.nextId(polls),
      eventId: dto.eventId,
      question: dto.question,
      options: dto.options.map((label: string) => ({ label, votes: 0, voters: [] })),
      status: 'open',
      createdBy: dto.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    polls.push(newPoll);
    this.writeFile(polls);
    return newPoll;
  }

  vote(id: string, dto: any): Poll {
    const polls = this.readFile();
    const poll = polls.find((p) => p.id === id);
    if (!poll) throw new NotFoundException(`Poll "${id}" not found`);

    if (poll.status === 'closed') {
      throw new BadRequestException(`Poll "${id}" is closed and no longer accepting votes`);
    }

    const hasVoted = poll.options.some((opt) => opt.voters.includes(dto.voterEmail));
    if (hasVoted) {
      throw new ConflictException(`"${dto.voterEmail}" has already voted in this poll`);
    }

    const option = poll.options.find((opt) => opt.label === dto.option);
    if (!option) {
      throw new BadRequestException(
        `Invalid option "${dto.option}". Valid options: ${poll.options.map((o) => o.label).join(', ')}`,
      );
    }

    option.votes += 1;
    option.voters.push(dto.voterEmail);
    poll.updatedAt = new Date().toISOString();
    this.writeFile(polls);
    return poll;
  }

  update(id: string, dto: any): Poll {
    const polls = this.readFile();
    const index = polls.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Poll "${id}" not found`);

    const existing = polls[index];
    let updatedOptions = existing.options;
    if (dto.options) {
      updatedOptions = dto.options.map((label: string) => ({ label, votes: 0, voters: [] }));
    }

    polls[index] = {
      ...existing,
      question: dto.question ?? existing.question,
      options: updatedOptions,
      status: dto.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };
    this.writeFile(polls);
    return polls[index];
  }

  close(id: string): Poll {
    const polls = this.readFile();
    const poll = polls.find((p) => p.id === id);
    if (!poll) throw new NotFoundException(`Poll "${id}" not found`);
    poll.status = 'closed';
    poll.updatedAt = new Date().toISOString();
    this.writeFile(polls);
    return poll;
  }

  remove(id: string): { message: string } {
    const polls = this.readFile();
    const index = polls.findIndex((p) => p.id === id);
    if (index === -1) throw new NotFoundException(`Poll "${id}" not found`);
    polls.splice(index, 1);
    this.writeFile(polls);
    return { message: `Poll "${id}" deleted` };
  }

  getResults(id: string): object {
    const poll = this.findOne(id);
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    return {
      pollId: poll.id,
      question: poll.question,
      status: poll.status,
      totalVotes,
      results: poll.options.map((opt) => ({
        option: opt.label,
        votes: opt.votes,
        percentage: totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) + '%' : '0%',
      })),
    };
  }
}
