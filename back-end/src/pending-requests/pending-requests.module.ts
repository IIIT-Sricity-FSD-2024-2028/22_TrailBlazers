import { Module } from '@nestjs/common';
import { PendingRequestsController } from './pending-requests.controller';
import { PendingRequestsService } from './pending-requests.service';

@Module({
  controllers: [PendingRequestsController],
  providers: [PendingRequestsService],
  exports: [PendingRequestsService],
})
export class PendingRequestsModule {}
