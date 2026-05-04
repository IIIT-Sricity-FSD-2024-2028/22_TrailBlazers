import { Module } from '@nestjs/common';
import { PollResponsesController } from './poll-responses.controller';
import { PollResponsesService } from './poll-responses.service';
import { PollResponsesRepository } from '../repositories/poll-responses.repository';

@Module({
  controllers: [PollResponsesController],
  providers:   [PollResponsesRepository, PollResponsesService],
  exports:     [PollResponsesRepository, PollResponsesService],
})
export class PollResponsesModule {}
