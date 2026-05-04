import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
