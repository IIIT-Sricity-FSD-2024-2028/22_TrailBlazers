import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { RsvpsModule } from './rsvps/rsvps.module';
import { PendingRequestsModule } from './pending-requests/pending-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeamsModule } from './teams/teams.module';
import { PollsModule } from './polls/polls.module';
import { QnaModule } from './qna/qna.module';

@Module({
  imports: [
    EventsModule,
    UsersModule,
    RsvpsModule,
    PendingRequestsModule,
    NotificationsModule,
    TeamsModule,
    PollsModule,
    QnaModule,
  ],
})
export class AppModule {}
