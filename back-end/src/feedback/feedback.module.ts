import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Module({
  controllers: [FeedbackController],
  providers:   [FeedbackRepository, FeedbackService],
  exports:     [FeedbackRepository, FeedbackService],
})
export class FeedbackModule {}
