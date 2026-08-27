import { Module } from '@nestjs/common';
import { ChangeRequestsController } from './change-requests.controller';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestsRepository } from '../../repositories/change-requests.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService, ChangeRequestsRepository],
  exports: [ChangeRequestsService, ChangeRequestsRepository],
})
export class ChangeRequestsModule {}
