import { Module } from '@nestjs/common';
import { CheckInsController } from './checkins.controller';
import { CheckInsService } from './checkins.service';
import { CheckInsRepository } from '../repositories/checkins.repository';

@Module({
  controllers: [CheckInsController],
  providers:   [CheckInsRepository, CheckInsService],
  exports:     [CheckInsRepository, CheckInsService],
})
export class CheckInsModule {}
