import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from '../../repositories/tickets.repository';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [InvitationsModule],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository],
  exports: [TicketsService, TicketsRepository],
})
export class TicketsModule {}
