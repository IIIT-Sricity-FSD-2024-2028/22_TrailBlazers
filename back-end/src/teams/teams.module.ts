import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService }    from './teams.service';
import { TeamsRepository } from '../repositories/teams.repository';

// UsersRepository comes from the @Global() UsersModule — no need to re-provide it here.

@Module({
  controllers: [TeamsController],
  providers:   [TeamsRepository, TeamsService],
  exports:     [TeamsService, TeamsRepository],
})
export class TeamsModule {}
