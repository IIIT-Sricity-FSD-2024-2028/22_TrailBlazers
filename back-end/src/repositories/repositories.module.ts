/**
 * repositories.module.ts
 * NestJS module that registers all repository classes as providers.
 * Import this module into any feature module that needs data access.
 */
import { Module } from '@nestjs/common';

import { EventsRepository }          from './events.repository';
import { UsersRepository }           from './users.repository';
import { RsvpsRepository }           from './rsvps.repository';
import { PollsRepository }           from './polls.repository';
import { PendingRequestsRepository } from './pending-requests.repository';
import { TeamsRepository }           from './teams.repository';
import { NotificationsRepository }   from './notifications.repository';

const REPOSITORIES = [
  EventsRepository,
  UsersRepository,
  RsvpsRepository,
  PollsRepository,
  PendingRequestsRepository,
  TeamsRepository,
  NotificationsRepository,
];

@Module({
  providers: REPOSITORIES,
  exports:   REPOSITORIES,
})
export class RepositoriesModule {}
