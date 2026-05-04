import { Module } from '@nestjs/common';
import { EventsModule }        from './events/events.module';
import { UsersModule }         from './users/users.module';
import { RsvpsModule }         from './rsvps/rsvps.module';
import { PendingRequestsModule } from './pending-requests/pending-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeamsModule }         from './teams/teams.module';
import { PollsModule }         from './polls/polls.module';
import { QnaModule }           from './qna/qna.module';
// ── ER-diagram entities ───────────────────────────────────────────────────────
import { CheckInsModule }      from './checkins/checkins.module';
import { FeedbackModule }      from './feedback/feedback.module';
import { SessionsModule }      from './sessions/sessions.module';
import { ReportsModule }       from './reports/reports.module';
import { PollResponsesModule } from './poll-responses/poll-responses.module';

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
    // ── ER diagram ───────────────────────────────────
    CheckInsModule,
    FeedbackModule,
    SessionsModule,
    ReportsModule,
    PollResponsesModule,
  ],
})
export class AppModule {}
