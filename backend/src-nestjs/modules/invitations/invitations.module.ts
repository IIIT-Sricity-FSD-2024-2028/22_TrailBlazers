import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from '../../repositories/invitations.repository';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository],
  exports: [InvitationsService, InvitationsRepository],
})
export class InvitationsModule {}
