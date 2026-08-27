import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { RespondToPollDto } from './dto/respond-to-poll.dto';
import { PollsRepository } from '../../repositories/polls.repository';

@Injectable()
export class PollsService {
  constructor(private readonly pollsRepository: PollsRepository) {}

  getActivePolls(eventId: string) {
    const polls = this.pollsRepository.findActivePollsByEventId(eventId);
    const enriched = polls.map((p) => {
      const options = this.pollsRepository.findPollOptionsByPollId(p.id);
      return {
        ...p,
        options,
      };
    });
    return { polls: enriched };
  }

  respondToPoll(pollId: string, dto: RespondToPollDto, user: any) {
    if (!dto.optionId) {
      throw new BadRequestException('Option ID is required.');
    }

    const poll = this.pollsRepository.findPollById(pollId);
    if (!poll) {
      throw new NotFoundException('Poll not found.');
    }

    if (poll.status !== 'LAUNCHED') {
      throw new BadRequestException(
        `Poll is not active for responses. Current status is '${poll.status}'.`,
      );
    }

    const validOption = this.pollsRepository.findPollOptionByIdAndPollId(
      dto.optionId,
      pollId,
    );
    if (!validOption) {
      throw new BadRequestException(
        'Selected option does not belong to this poll.',
      );
    }

    const userId = user.id;
    const ticket = this.pollsRepository.findTicketByUserAndEvent(userId, poll.eventId);
    const isOwner = this.pollsRepository.findEventRequestByUserAndEvent(userId, poll.eventId);

    if (!ticket && !isOwner) {
      throw new ForbiddenException(
        'Access denied. You must be registered for this event to respond to polls.',
      );
    }

    const responseId = 'presp_' + crypto.randomBytes(8).toString('hex');

    try {
      this.pollsRepository.insertPollResponse({
        id: responseId,
        pollId,
        optionId: dto.optionId,
        userId,
      });
      return { message: 'Poll response submitted successfully.' };
    } catch (e: any) {
      if (
        e.code === 'SQLITE_CONSTRAINT' ||
        (e.message && e.message.includes('UNIQUE'))
      ) {
        throw new BadRequestException(
          'You have already submitted a response for this poll.',
        );
      }
      throw e;
    }
  }

  private verifyEventAccess(eventId: string, session: any, user: any) {
    if (session && session.eventId && session.eventId !== eventId) {
      throw new BadRequestException(
        `Session '${session.id}' does not belong to event '${eventId}'.`,
      );
    }

    const event = this.pollsRepository.findEventOrRequestById(eventId);
    if (!event) {
      throw new NotFoundException(`Event '${eventId}' not found.`);
    }

    const role = (user.role || '').toUpperCase();

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return event;
    }

    if (role === 'CLIENT' || role === 'ATTENDEE') {
      const isOwner =
        event.userId === user.id ||
        event.organizerUserId === user.id ||
        event.createdByUserId === user.id;

      if (!isOwner) {
        throw new ForbiddenException(
          'Access denied. You can only manage polls for events you own.',
        );
      }
      return event;
    }

    if (role === 'EVENT_MANAGER') {
      const isAssigned =
        event.eventManagerUserId === user.id ||
        event.userId === user.id ||
        event.organizerUserId === user.id ||
        event.status === 'COMMERCIAL_APPROVED' ||
        event.operationalStatus === 'IN_PREPARATION' ||
        event.operationalStatus === 'READY';

      if (!isAssigned) {
        throw new ForbiddenException(
          'Access denied. You are not assigned to manage this event.',
        );
      }
      return event;
    }

    if (role === 'ONSITE_COORDINATOR') {
      const isAssigned =
        event.onsiteCoordinatorUserId === user.id ||
        event.operationalStatus === 'READY' ||
        event.operationalStatus === 'LIVE';

      if (!isAssigned) {
        throw new ForbiddenException(
          'Access denied. You are not authorized for this event.',
        );
      }
      return event;
    }

    throw new ForbiddenException(`Role '${role}' is unauthorized for poll management.`);
  }

  createSessionPoll(
    dto: {
      eventId: string;
      sessionId: string;
      questionText: string;
      options: string[];
      status?: string;
    },
    user: any,
  ) {
    const { eventId, sessionId, questionText, options, status = 'LAUNCHED' } = dto;

    if (!questionText || !questionText.trim()) {
      throw new BadRequestException('Poll question text cannot be empty.');
    }

    const validOptions = (options || [])
      .map((o) => (o || '').trim())
      .filter((o) => o.length > 0);

    if (validOptions.length < 2) {
      throw new BadRequestException('A poll must have at least 2 non-empty option choices.');
    }

    const session = this.pollsRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session '${sessionId}' not found.`);
    }

    this.verifyEventAccess(eventId, session, user);

    const pollId = 'epoll_' + crypto.randomBytes(8).toString('hex');
    const result = this.pollsRepository.createSessionPollTransaction({
      pollId,
      eventId,
      sessionId,
      questionText: questionText.trim(),
      options: validOptions,
      status: status || 'LAUNCHED',
      createdByUserId: user.id,
    });

    return {
      message: 'Session poll created successfully.',
      poll: result.poll,
      options: result.options,
    };
  }

  getSessionPolls(eventId: string, sessionId: string, user: any) {
    const session = this.pollsRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session '${sessionId}' not found.`);
    }

    this.verifyEventAccess(eventId, session, user);

    const polls = this.pollsRepository.findPollsBySessionId(sessionId);
    const enriched = polls.map((p) => {
      const options = this.pollsRepository.findPollOptionsByPollId(p.id);
      const responses = this.pollsRepository.getPollResponsesByPollId(p.id);
      const totalResponses = responses.length;

      const enrichedOptions = options.map((opt) => {
        const count = responses.filter((r) => r.optionId === opt.id).length;
        const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
        return {
          ...opt,
          count,
          percentage,
        };
      });

      return {
        ...p,
        totalResponses,
        options: enrichedOptions,
      };
    });

    return { polls: enriched };
  }
}

