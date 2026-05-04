import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PollsRepository } from '../repositories/polls.repository';
import { PollResponsesRepository } from '../repositories/poll-responses.repository';

@Injectable()
export class PollsService {
  constructor(
    private readonly repo: PollsRepository,
    private readonly responsesRepo: PollResponsesRepository,
  ) {}

  findAll(eventId?: string, status?: string) {
    return this.repo.store.filter(p => {
      if (eventId && p.eventId !== eventId) return false;
      if (status  && p.status  !== status)  return false;
      return true;
    });
  }

  findOne(id: string) {
    const poll = this.repo.findById(id);
    if (!poll) throw new NotFoundException(`Poll "${id}" not found`);
    return poll;
  }

  findByEvent(eventId: string) { return this.repo.findByEventId(eventId); }

  create(dto: any) {
    return this.repo.save({
      id:        this.repo.nextPollId(),
      eventId:   dto.eventId,
      question:  dto.question,
      options:   dto.options.map((label: string) => ({ label, votes: 0, voters: [] })),
      status:    'open',
      createdBy: dto.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  vote(id: string, dto: any) {
    const poll = this.findOne(id);
    if (poll.status === 'closed') throw new BadRequestException(`Poll "${id}" is closed`);

    // Check duplicate vote in polls.json voters list
    const hasVoted = poll.options.some(o => o.voters.includes(dto.voterEmail));
    if (hasVoted) throw new ConflictException(`"${dto.voterEmail}" has already voted`);

    // Check duplicate vote in poll-responses.json
    if (this.responsesRepo.existsForPoll(id, dto.voterEmail))
      throw new ConflictException(`"${dto.voterEmail}" has already responded to this poll`);

    const option = poll.options.find(o => o.label === dto.option);
    if (!option) throw new BadRequestException(
      `Invalid option "${dto.option}". Valid: ${poll.options.map(o => o.label).join(', ')}`
    );

    // 1. Update vote counter + voters list in polls.json
    option.votes += 1;
    option.voters.push(dto.voterEmail);
    poll.updatedAt = new Date().toISOString();
    this.repo.update(id, { options: poll.options, updatedAt: poll.updatedAt });

    // 2. Persist the individual response to poll-responses.json
    const response = this.responsesRepo.save({
      id:            this.responsesRepo.nextResponseId(),
      pollId:        id,
      attendeeId:    dto.attendeeId || dto.voterEmail.split('@')[0],
      attendeeEmail: dto.voterEmail,
      answer:        dto.option,
      createdAt:     new Date().toISOString(),
    });

    return { poll, response };
  }

  update(id: string, dto: any) {
    const existing = this.findOne(id);
    const options = dto.options
      ? dto.options.map((label: string) => ({ label, votes: 0, voters: [] }))
      : existing.options;
    return this.repo.update(id, {
      question: dto.question ?? existing.question,
      options,
      status:   dto.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    })!;
  }

  close(id: string) {
    this.findOne(id);
    return this.repo.update(id, { status: 'closed', updatedAt: new Date().toISOString() })!;
  }

  remove(id: string) {
    if (!this.repo.findById(id)) throw new NotFoundException(`Poll "${id}" not found`);
    this.repo.delete(id);
    return { message: `Poll "${id}" deleted` };
  }

  getResults(id: string) {
    const poll = this.findOne(id);
    const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
    return {
      pollId: poll.id, question: poll.question, status: poll.status, totalVotes,
      results: poll.options.map(o => ({
        option: o.label, votes: o.votes,
        percentage: totalVotes > 0 ? ((o.votes / totalVotes) * 100).toFixed(1) + '%' : '0%',
      })),
    };
  }
}
