import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InvitationsRepository } from '../../repositories/invitations.repository';
import { NestLoggerService } from '../../common/logging/logger.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly repository: InvitationsRepository,
    private readonly logger: NestLoggerService,
  ) {}

  checkAndUpdateExpired(inv: any) {
    return this.repository.checkAndUpdateExpired(inv);
  }

  createInvitation(dto: CreateInvitationDto, user: any) {
    const { eventId, recipientEmail, recipientName, expiresInDays } = dto;
    const senderUserId = user.id;

    if (!eventId || !recipientEmail) {
      throw new BadRequestException(
        'Event ID and recipient email address are required.',
      );
    }

    const cleanEmail = recipientEmail.toLowerCase().trim();

    // Verify event existence
    const event = this.repository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    // Authorization check: User must be event organizer, ADMIN, or EVENT_MANAGER
    const isOwner = event.organizerUserId === senderUserId;
    const isAdmin = user.role === 'ADMIN';
    const isManager = user.role === 'EVENT_MANAGER';

    if (!isOwner && !isAdmin && !isManager) {
      throw new ForbiddenException(
        'Unauthorized. You are not authorized to create invitations for this event.',
      );
    }

    // Generate secure unpredictable invitation token & code
    const invitationId = 'inv_' + crypto.randomBytes(8).toString('hex');
    const invitationToken =
      'inv_tok_' + crypto.randomBytes(16).toString('hex');
    const inviteCode =
      'INV-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const days = expiresInDays !== undefined ? Number(expiresInDays) : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 19);

    const created = this.repository.createInvitation({
      id: invitationId,
      eventId,
      invitationToken,
      inviteCode,
      recipientEmail: cleanEmail,
      recipientName: recipientName || null,
      senderUserId,
      expiresAt,
    });

    return {
      message: `Secure invitation created for ${cleanEmail}!`,
      invitation: created,
    };
  }

  validateInvitation(dto: ValidateInvitationDto, user: any) {
    const { eventId, inviteCode } = dto;
    const authUserEmail = user.email ? user.email.toLowerCase().trim() : '';

    if (!eventId || !inviteCode) {
      throw new BadRequestException(
        'Event ID and invitation code/token are required.',
      );
    }

    const cleanCode = inviteCode.trim();

    let inv = this.repository.findInvitationByTokenOrCode(eventId, cleanCode);

    if (!inv) {
      throw new ForbiddenException({
        valid: false,
        error: 'Invalid invitation code or token for this private event.',
      });
    }

    inv = this.checkAndUpdateExpired(inv);

    if (inv.status === 'revoked') {
      throw new ForbiddenException({
        valid: false,
        error: 'This invitation has been revoked by the event manager.',
      });
    }

    if (inv.status === 'expired') {
      throw new ForbiddenException({
        valid: false,
        error: 'This invitation has expired.',
      });
    }

    if (inv.status === 'accepted') {
      throw new ForbiddenException({
        valid: false,
        error: 'This invitation has already been used to register for this event.',
      });
    }

    // Verify recipient email matches authenticated user email
    if (inv.recipientEmail.toLowerCase().trim() !== authUserEmail) {
      throw new ForbiddenException({
        valid: false,
        error: `This private invitation is issued specifically for ${inv.recipientEmail}. You are signed in as ${authUserEmail}.`,
      });
    }

    return {
      valid: true,
      message: 'Invitation is valid and matches your account!',
      invitation: {
        id: inv.id,
        recipientEmail: inv.recipientEmail,
        expiresAt: inv.expiresAt,
        status: inv.status,
      },
    };
  }

  getEventInvitations(eventId: string, user: any) {
    const authUserId = user.id;

    const event = this.repository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    // Authorization check: Only event owner, admin, event manager, or sender can list invitations
    const isOwner = event.organizerUserId === authUserId;
    const isAdmin = user.role === 'ADMIN';
    const isManager = user.role === 'EVENT_MANAGER';
    const isSender = this.repository.isSender(eventId, authUserId);

    if (!isOwner && !isAdmin && !isManager && !isSender) {
      throw new ForbiddenException(
        'Unauthorized. Only the event owner or authorized manager can view invitations for this event.',
      );
    }

    const invitations = this.repository.findInvitationsByEventId(eventId);

    return { invitations };
  }

  revokeInvitation(id: string, user: any) {
    const authUserId = user.id;

    const inv = this.repository.findInvitationById(id);
    if (!inv) {
      throw new NotFoundException('Invitation record not found.');
    }

    // Authorization check: Sender of invitation, Event Owner, Admin, or Event Manager
    const isSender = inv.senderUserId === authUserId;
    const isOwner = inv.organizerUserId === authUserId;
    const isAdmin = user.role === 'ADMIN';
    const isManager = user.role === 'EVENT_MANAGER';

    if (!isSender && !isOwner && !isAdmin && !isManager) {
      throw new ForbiddenException(
        'Unauthorized. You are not authorized to revoke this invitation.',
      );
    }

    this.repository.revokeInvitation(id);

    return {
      message: 'Invitation successfully revoked.',
      invitationId: id,
      status: 'revoked',
    };
  }

  // Reusable API methods for future TicketsModule
  findInvitationByTokenOrCode(eventId: string, codeOrToken: string) {
    return this.repository.findInvitationByTokenOrCode(eventId, codeOrToken);
  }

  markInvitationAccepted(invitationId: string, userId: string) {
    return this.repository.markInvitationAccepted(invitationId, userId);
  }
}
