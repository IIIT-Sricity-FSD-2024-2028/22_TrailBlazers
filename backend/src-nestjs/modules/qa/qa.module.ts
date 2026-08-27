import { Module } from '@nestjs/common';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';
import { QaRepository } from '../../repositories/qa.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [QaController],
  providers: [QaService, QaRepository],
  exports: [QaService, QaRepository],
})
export class QaModule {}
