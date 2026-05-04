import { Module } from '@nestjs/common';
import { PendingRequestsController } from './pending-requests.controller';
import { PendingRequestsService }    from './pending-requests.service';
import { PendingRequestsRepository } from '../repositories/pending-requests.repository';

// EventsRepository is NOT listed here — it comes from the @Global() EventsModule
// so PendingRequestsService gets the SAME singleton EventsRepository instance
// that EventsService uses. This ensures approve/review updates the shared in-memory store.

@Module({
  controllers: [PendingRequestsController],
  providers:   [PendingRequestsRepository, PendingRequestsService],
  exports:     [PendingRequestsService, PendingRequestsRepository],
})
export class PendingRequestsModule {}
