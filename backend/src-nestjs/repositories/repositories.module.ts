import { Module, Global } from '@nestjs/common';
import { InMemoryStore } from './in-memory.store';
import { UsersRepository } from './users.repository';
import { EventsRepository } from './events.repository';
import { EventRequestsRepository } from './event-requests.repository';
import { RevenueRepository } from './revenue.repository';
import { QuotationsRepository } from './quotations.repository';
import { EventManagerRepository } from './event-manager.repository';
import { InvitationsRepository } from './invitations.repository';
import { TicketsRepository } from './tickets.repository';
import { OnsiteCoordinatorRepository } from './onsite-coordinator.repository';
import { AnalyticsRepository } from './analytics.repository';
import { QaRepository } from './qa.repository';
import { PollsRepository } from './polls.repository';
import { FeedbackRepository } from './feedback.repository';
import { NotificationsRepository } from './notifications.repository';
import { ChangeRequestsRepository } from './change-requests.repository';
import { HierarchyRepository } from './hierarchy.repository';

@Global()
@Module({
  providers: [
    InMemoryStore,
    UsersRepository,
    EventsRepository,
    EventRequestsRepository,
    RevenueRepository,
    QuotationsRepository,
    EventManagerRepository,
    InvitationsRepository,
    TicketsRepository,
    OnsiteCoordinatorRepository,
    AnalyticsRepository,
    QaRepository,
    PollsRepository,
    FeedbackRepository,
    NotificationsRepository,
    ChangeRequestsRepository,
    HierarchyRepository,
  ],
  exports: [
    InMemoryStore,
    UsersRepository,
    EventsRepository,
    EventRequestsRepository,
    RevenueRepository,
    QuotationsRepository,
    EventManagerRepository,
    InvitationsRepository,
    TicketsRepository,
    OnsiteCoordinatorRepository,
    AnalyticsRepository,
    QaRepository,
    PollsRepository,
    FeedbackRepository,
    NotificationsRepository,
    ChangeRequestsRepository,
    HierarchyRepository,
  ],
})
export class RepositoriesModule {}
