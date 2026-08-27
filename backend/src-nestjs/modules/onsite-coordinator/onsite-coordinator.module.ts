import { Module } from '@nestjs/common';
import { OnsiteCoordinatorController } from './onsite-coordinator.controller';
import { OnsiteCoordinatorService } from './onsite-coordinator.service';
import { OnsiteCoordinatorRepository } from '../../repositories/onsite-coordinator.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [OnsiteCoordinatorController],
  providers: [OnsiteCoordinatorService, OnsiteCoordinatorRepository],
  exports: [OnsiteCoordinatorService, OnsiteCoordinatorRepository],
})
export class OnsiteCoordinatorModule {}
