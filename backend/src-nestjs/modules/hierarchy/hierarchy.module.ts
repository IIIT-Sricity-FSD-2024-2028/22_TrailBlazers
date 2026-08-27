import { Module } from '@nestjs/common';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';
import { HierarchyRepository } from '../../repositories/hierarchy.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [HierarchyController],
  providers: [HierarchyService, HierarchyRepository],
  exports: [HierarchyService, HierarchyRepository],
})
export class HierarchyModule {}
