import { Module } from '@nestjs/common';
import { RevenueController } from './revenue.controller';
import { ClientQuotationsController } from './client-quotations.controller';
import { RevenueService } from './revenue.service';
import { QuotationsService } from './quotations.service';
import { RevenueRepository } from '../../repositories/revenue.repository';
import { QuotationsRepository } from '../../repositories/quotations.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [RevenueController, ClientQuotationsController],
  providers: [
    RevenueService,
    QuotationsService,
    RevenueRepository,
    QuotationsRepository,
  ],
  exports: [RevenueService, QuotationsService, RevenueRepository, QuotationsRepository],
})
export class RevenueModule {}
