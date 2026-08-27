import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PollsRepository } from '../../repositories/polls.repository';

@Module({
  controllers: [PollsController],
  providers: [PollsService, PollsRepository],
  exports: [PollsService, PollsRepository],
})
export class PollsModule {}
