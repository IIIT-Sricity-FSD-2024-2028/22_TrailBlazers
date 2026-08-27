import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { TicketsRepository } from '../../repositories/tickets.repository';
import { InvitationsRepository } from '../../repositories/invitations.repository';
import { NestLoggerService } from '../../common/logging/logger.service';
import { RegisterTicketDto } from './dto/register-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly repository: TicketsRepository,
    private readonly invitationsRepository: InvitationsRepository,
    private readonly logger: NestLoggerService,
  ) {}

  registerTicket(dto: RegisterTicketDto, user: any) {
    const userId = user.id;
    const { eventId, quantity, paymentMethod, inviteCode, invitationToken } = dto;
    const rawInviteCode = inviteCode || (dto as any).invitationCode;

    // 1. Check user email verification status
    const dbUser = this.repository.findUserVerifiedStatus(userId);
    if (!dbUser || !dbUser.emailVerified) {
      throw new ForbiddenException(
        'Email verification is required before registering for events. Please verify your email address.',
      );
    }

    if (!eventId || !quantity || quantity <= 0) {
      throw new BadRequestException(
        'Valid event ID and a quantity of at least 1 ticket are required.',
      );
    }

    // 2. Lookup Event
    const event = this.repository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    // Check Event Registration Status (OPEN / PAUSED / CLOSED)
    const eventReq = this.repository.findEventById(eventId); // or findEventRequestById
    const eventReqFallback = (this.repository as any).findEventRequestById ? (this.repository as any).findEventRequestById(eventId) : null;
    const rawStatus = event.registrationStatus || (eventReqFallback ? eventReqFallback.registrationStatus : 'OPEN') || 'OPEN';
    const regStatus = String(rawStatus).toUpperCase();

    if (regStatus === 'PAUSED') {
      throw new BadRequestException(
        'Registration for this event is currently PAUSED by the Event Manager. Please try again later.',
      );
    }
    if (regStatus === 'CLOSED') {
      throw new BadRequestException(
        'Registration for this event is CLOSED.',
      );
    }

    let validatedInvitationId: string | null = null;

    // 3. Closed Event Private Invitation Validation
    if (event.type === 'CLOSED' || event.accessType === 'CLOSED' || event.isPrivate) {
      const codeOrToken = (invitationToken || rawInviteCode || '').trim();

      if (!codeOrToken) {
        throw new ForbiddenException(
          'Invitation code or token is required to register for this private event.',
        );
      }

      let inv = this.invitationsRepository.findInvitationByTokenOrCode(
        eventId,
        codeOrToken,
      );

      if (inv) {
        inv = this.invitationsRepository.checkAndUpdateExpired(inv);

        if (inv.status === 'revoked') {
          throw new ForbiddenException(
            'This invitation has been revoked by the event manager.',
          );
        }

        if (inv.status === 'expired') {
          throw new ForbiddenException('This invitation has expired.');
        }

        if (inv.status === 'accepted') {
          throw new ForbiddenException(
            'This invitation has already been used to register for this event.',
          );
        }

        const authEmail = user.email ? user.email.toLowerCase().trim() : '';
        if (inv.recipientEmail.toLowerCase().trim() !== authEmail) {
          throw new ForbiddenException(
            `This private invitation is issued specifically for ${inv.recipientEmail}. You are currently signed in as ${user.email}.`,
          );
        }

        validatedInvitationId = inv.id;
      } else {
        if (
          !event.inviteCode ||
          codeOrToken.toUpperCase() !== event.inviteCode.toUpperCase()
        ) {
          throw new ForbiddenException(
            'Invalid invitation code or token for this private event.',
          );
        }
      }
    }

    // 4. Ticket Availability Check
    if (event.availableTickets < quantity) {
      throw new BadRequestException(
        `Only ${event.availableTickets} tickets are remaining for this event. You requested ${quantity}.`,
      );
    }

    // 5. Dynamic Cost Calculation
    const unitPrice = Number(event.ticketPrice);
    const subtotal = unitPrice * quantity;
    const platformFee = unitPrice > 0 ? Math.round(subtotal * 0.05 + 25) : 0;
    const totalAmount = subtotal + platformFee;

    // 6. ID & Reference Generation
    const ticketId = 'tkt_' + crypto.randomBytes(8).toString('hex');
    const ticketNumber =
      'EVT-2026-' + Math.floor(100000 + Math.random() * 900000);
    const paymentId = 'pay_' + crypto.randomBytes(8).toString('hex');
    const transactionId =
      'TXN-2026-' + Math.floor(10000000 + Math.random() * 90000000);

    const ticketData = {
      id: ticketId,
      ticketNumber,
      userId,
      eventId,
      ticketType: 'Standard',
      quantity,
      unitPrice,
      subtotal,
      platformFee,
      totalAmount,
      paymentStatus: 'CONFIRMED',
      registrationStatus: 'ACTIVE',
    };

    const paymentData = {
      id: paymentId,
      ticketId,
      userId,
      amount: totalAmount,
      paymentMethod: paymentMethod || 'UPI',
      transactionId,
      status: 'SUCCESS',
    };

    // 7. Atomic Transaction Execution
    this.repository.executeRegistrationTransaction({
      ticket: ticketData,
      payment: paymentData,
      eventId,
      quantity,
      validatedInvitationId,
      userId,
    });

    const createdTicket =
      this.repository.findTicketWithEventDetails(ticketId);

    return {
      message: 'Ticket registration and payment confirmed successfully!',
      ticket: createdTicket,
      payment: {
        id: paymentId,
        transactionId,
        amount: totalAmount,
        paymentMethod: paymentMethod || 'UPI',
        status: 'SUCCESS',
      },
    };
  }

  getMyTickets(userId: string) {
    const tickets = this.repository.findUserTickets(userId);
    return { tickets };
  }

  getTicketById(id: string, userId: string) {
    const ticket = this.repository.findUserTicketById(id, userId);
    if (!ticket) {
      throw new NotFoundException('Ticket record not found.');
    }
    return { ticket };
  }
}
