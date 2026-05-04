import { Module } from '@nestjs/common';
import { RsvpsController } from './rsvps.controller';
import { RsvpsService }    from './rsvps.service';
import { RsvpsRepository } from '../repositories/rsvps.repository';

// UsersRepository comes from the @Global() UsersModule — no need to re-provide it here.

@Module({
  controllers: [RsvpsController],
  providers:   [RsvpsRepository, RsvpsService],
  exports:     [RsvpsService, RsvpsRepository],
})
export class RsvpsModule {}
