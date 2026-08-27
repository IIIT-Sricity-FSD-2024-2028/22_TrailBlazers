import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { LoggingModule } from './common/logging/logging.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { SeedModule } from './seed/seed.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventRequestsModule } from './modules/event-requests/event-requests.module';
import { EventsModule } from './modules/events/events.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { EventManagerModule } from './modules/event-manager/event-manager.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { OnsiteCoordinatorModule } from './modules/onsite-coordinator/onsite-coordinator.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { QaModule } from './modules/qa/qa.module';
import { PollsModule } from './modules/polls/polls.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChangeRequestsModule } from './modules/change-requests/change-requests.module';
import { HierarchyModule } from './modules/hierarchy/hierarchy.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { MaintenanceModeMiddleware } from './common/middleware/maintenance-mode.middleware';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { ApiVersionMiddleware } from './common/middleware/api-version.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    RepositoriesModule,
    SeedModule,
    LoggingModule,
    HealthModule,
    UsersModule,
    AuthModule,
    EventRequestsModule,
    EventsModule,
    RevenueModule,
    EventManagerModule,
    InvitationsModule,
    TicketsModule,
    OnsiteCoordinatorModule,
    AnalyticsModule,
    QaModule,
    PollsModule,
    FeedbackModule,
    NotificationsModule,
    ChangeRequestsModule,
    HierarchyModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestLoggingMiddleware,
        MaintenanceModeMiddleware,
        RequestContextMiddleware,
        ApiVersionMiddleware,
      )
      .forRoutes('*');
  }
}


