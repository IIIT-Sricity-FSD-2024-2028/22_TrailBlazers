import { Module } from '@nestjs/common';
import {
  EventsFeedbackController,
  FeedbackPollsController,
} from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FeedbackRepository } from '../../repositories/feedback.repository';

@Module({
  controllers: [EventsFeedbackController, FeedbackPollsController],
  providers: [FeedbackService, FeedbackRepository],
  exports: [FeedbackService, FeedbackRepository],
})
export class FeedbackModule {}
