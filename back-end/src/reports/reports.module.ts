import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from '../repositories/reports.repository';

@Module({
  controllers: [ReportsController],
  providers:   [ReportsRepository, ReportsService],
  exports:     [ReportsRepository, ReportsService],
})
export class ReportsModule {}
