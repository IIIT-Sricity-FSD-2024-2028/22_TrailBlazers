import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PollsRepository } from '../repositories/polls.repository';
import { PollResponsesModule } from '../poll-responses/poll-responses.module';

@Module({
  imports:     [PollResponsesModule],
  controllers: [PollsController],
  providers:   [PollsRepository, PollsService],
  exports:     [PollsService, PollsRepository],
})
export class PollsModule {}
