import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PollResponsesRepository } from '../repositories/poll-responses.repository';

@Injectable()
export class PollResponsesService {
  constructor(private readonly repo: PollResponsesRepository) {}

  findAll(pollId?: string, attendeeId?: string) {
    return this.repo.store.filter(r => {
      if (pollId     && r.pollId     !== pollId)     return false;
      if (attendeeId && r.attendeeId !== attendeeId) return false;
      return true;
    });
  }

  findOne(id: string) {
    const item = this.repo.findById(id);
    if (!item) throw new NotFoundException(`Poll response "${id}" not found`);
    return item;
  }

  create(dto: any) {
    if (this.repo.existsForPoll(dto.pollId, dto.attendeeEmail))
      throw new ConflictException(`${dto.attendeeEmail} has already responded to this poll`);
    return this.repo.save({
      id:            this.repo.nextResponseId(),
      pollId:        dto.pollId,
      attendeeId:    dto.attendeeId,
      attendeeEmail: dto.attendeeEmail,
      answer:        dto.answer,
      createdAt:     new Date().toISOString(),
    });
  }

  remove(id: string) {
    this.findOne(id);
    this.repo.delete(id);
    return { message: `Poll response "${id}" deleted` };
  }

  /** Tally results for a poll */
  results(pollId: string) {
    const responses = this.repo.findByPoll(pollId);
    const tally: Record<string, number> = {};
    for (const r of responses) {
      tally[r.answer] = (tally[r.answer] || 0) + 1;
    }
    return { pollId, total: responses.length, tally };
  }
}
