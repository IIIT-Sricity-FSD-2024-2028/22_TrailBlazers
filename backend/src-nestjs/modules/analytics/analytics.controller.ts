import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (EVENT_MANAGER, CLIENT, SUPER_ADMIN)' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Analytics Dashboard', description: 'Retrieve completed events and primary event analytics metrics' })
  @ApiResponse({ status: 200, description: 'Analytics dashboard metrics returned' })
  @ApiResponse({ status: 403, description: 'Forbidden. Role unauthorized for analytics' })
  getDashboard(@Req() req: any) {
    try {
      const role = (req.user?.role || '').toUpperCase();
      if (role === 'REVENUE' || role === 'ONSITE_COORDINATOR' || role === 'SPEAKER') {
        throw new ForbiddenException(
          'Forbidden: Post-Event Analytics authorization required.',
        );
      }

      const events = this.analyticsService.getCompletedEventsForUser(req.user);
      if (events.length === 0) {
        return {
          hasData: false,
          message: 'No completed events found within your permitted scope.',
          events: [],
        };
      }

      const firstEventId = events[0].id;
      const primaryAnalytics =
        this.analyticsService.calculateFullEventAnalytics(firstEventId);

      return {
        hasData: true,
        events: events.map((e: any) => ({
          id: e.id,
          name: e.name,
          date: e.date,
          venue: e.venue,
          status: e.operationalStatus || e.status,
        })),
        primaryAnalytics,
      };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      console.error('Error fetching analytics dashboard:', err);
      throw new InternalServerErrorException('Failed to load analytics dashboard.');
    }
  }

  @Get('events')
  @ApiOperation({ summary: 'Get Analytics Events List', description: 'Retrieve completed events permitted for current user scope' })
  @ApiResponse({ status: 200, description: 'Analytics events list returned' })
  getEvents(@Req() req: any) {
    try {
      const role = (req.user?.role || '').toUpperCase();
      if (role === 'REVENUE' || role === 'ONSITE_COORDINATOR' || role === 'SPEAKER') {
        throw new ForbiddenException(
          'Forbidden: Post-Event Analytics authorization required.',
        );
      }

      const events = this.analyticsService.getCompletedEventsForUser(req.user);
      return { events };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      console.error('Error fetching analytics events:', err);
      throw new InternalServerErrorException('Failed to load events.');
    }
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare Multiple Events', description: 'Compare attendance, engagement, and satisfaction metrics across 2 to 5 events' })
  @ApiQuery({ name: 'eventIds', description: 'Comma-separated event IDs (e.g. evt_1,evt_2)' })
  @ApiResponse({ status: 200, description: 'Event comparison breakdown returned' })
  @ApiResponse({ status: 400, description: 'Fewer than 2 or more than 5 event IDs provided' })
  compareEvents(@Req() req: any, @Query('eventIds') eventIdsStr: string) {
    try {
      const eventIds = (eventIdsStr || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (eventIds.length < 2 || eventIds.length > 5) {
        throw new BadRequestException(
          'Please select between 2 and 5 events to compare.',
        );
      }

      for (const id of eventIds) {
        if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
          throw new ForbiddenException(
            `Access denied. Unauthorized to view analytics for event ${id}.`,
          );
        }
      }

      const comparisons = eventIds.map((id) => {
        const analytics = this.analyticsService.calculateFullEventAnalytics(id);
        if (!analytics) {
          throw new NotFoundException(`Event ${id} not found.`);
        }
        return {
          eventId: id,
          eventName: analytics.event.name,
          date: analytics.event.date,
          organization: analytics.event.organizationName,
          registrations: analytics.attendance.confirmedRegistrations,
          checkedIn: analytics.attendance.checkedInAttendees,
          attendanceRate: analytics.attendance.attendanceRate,
          qaTotal: analytics.engagement.qaTotal,
          qaAnswerRate: analytics.engagement.qaAnswerRate,
          pollResponses: analytics.engagement.pollResponsesCount,
          feedbackCount: analytics.feedback.totalCount,
          averageRating: analytics.feedback.averageRating,
          engagementScore: analytics.engagement.engagementScore,
          overallScore: analytics.performance.overallScore,
        };
      });

      return { comparisons };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof ForbiddenException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      console.error('Error comparing events:', err);
      throw new InternalServerErrorException('Failed to compare events.');
    }
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get Event Analytics Overview', description: 'Retrieve full analytics report for a specific event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Full event analytics object returned' })
  getEventAnalytics(@Req() req: any, @Param('id') id: string) {
    try {
      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException(
          'Access denied. You do not have permission to view analytics for this event.',
        );
      }

      const analytics = this.analyticsService.calculateFullEventAnalytics(id);
      if (!analytics) {
        throw new NotFoundException('Event not found.');
      }

      this.analyticsService.checkAndNotifyAnalyticsAvailable(id);

      return { analytics };
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      console.error('Error fetching event analytics:', err);
      throw new InternalServerErrorException('Failed to load event analytics.');
    }
  }

  @Get('events/:id/attendance')
  @ApiOperation({ summary: 'Get Attendance Analytics', description: 'Retrieve attendance rate, no-show rate, and check-in hourly timeline' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Attendance analytics returned' })
  getAttendance(@Req() req: any, @Param('id') id: string) {
    try {
      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException('Access denied.');
      }
      const attendance = this.analyticsService.calculateAttendance(id);
      return { attendance };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to load attendance.');
    }
  }

  @Get('events/:id/engagement')
  @ApiOperation({ summary: 'Get Engagement Analytics', description: 'Retrieve Q&A, Poll, and Feedback engagement score calculation' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Engagement analytics returned' })
  getEngagement(@Req() req: any, @Param('id') id: string) {
    try {
      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException('Access denied.');
      }
      const engagement = this.analyticsService.calculateEngagement(id);
      return { engagement };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to load engagement.');
    }
  }

  @Get('events/:id/sessions')
  @ApiOperation({ summary: 'Get Sessions Analytics', description: 'Retrieve session engagement rankings and speaker Q&A metrics' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Sessions analytics list returned' })
  getSessions(@Req() req: any, @Param('id') id: string) {
    try {
      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException('Access denied.');
      }
      const sessions = this.analyticsService.calculateSessions(id);
      return { sessions };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to load sessions.');
    }
  }

  @Get('events/:id/polls')
  @ApiOperation({ summary: 'Get Polls Analytics', description: 'Retrieve poll response breakdowns and winning options' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Polls analytics list returned' })
  getPolls(@Req() req: any, @Param('id') id: string) {
    try {
      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException('Access denied.');
      }
      const polls = this.analyticsService.calculatePolls(id);
      return { polls };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to load polls.');
    }
  }

  @Get('events/:id/questions')
  @ApiOperation({ summary: 'Get Q&A Questions Analytics', description: 'Retrieve top upvoted questions and answer rate' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Q&A analytics returned' })
  getQuestions(@Req() req: any, @Param('id') id: string) {
    try {
      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException('Access denied.');
      }
      const questions = this.analyticsService.calculateQuestions(id);
      return { questions };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to load Q&A questions.');
    }
  }

  @Get('events/:id/feedback')
  @ApiOperation({ summary: 'Get Feedback Analytics', description: 'Retrieve 1-5 rating breakdown, average score, and qualitative comments' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Feedback analytics returned' })
  getFeedback(@Req() req: any, @Param('id') id: string) {
    try {
      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException('Access denied.');
      }
      const feedback = this.analyticsService.calculateFeedback(id);
      return { feedback };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new InternalServerErrorException('Failed to load feedback.');
    }
  }

  @Get('events/:id/report')
  @ApiOperation({ summary: 'Export Analytics Report', description: 'Generate and download event analytics report in JSON or CSV format' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiQuery({ name: 'format', required: false, description: 'Report format (json / csv)' })
  @ApiResponse({ status: 200, description: 'Analytics report payload or CSV file attachment' })
  getReport(
    @Req() req: any,
    @Param('id') id: string,
    @Query('format') formatQuery: string,
    @Res() res: Response,
  ) {
    try {
      const format = formatQuery || 'json';

      if (!this.analyticsService.canViewEventAnalytics(req.user, id)) {
        throw new ForbiddenException('Access denied.');
      }

      const analytics = this.analyticsService.calculateFullEventAnalytics(id);
      if (!analytics) {
        throw new NotFoundException('Event not found.');
      }

      this.analyticsService.logAnalyticsExport({ eventId: id, user: req.user, format });

      if (format === 'csv') {
        const csvStr = this.analyticsService.generateCSVReport(analytics);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=wavevents_analytics_${id}.csv`,
        );
        return res.send(csvStr);
      }

      return res.json({ analytics, reportFormat: 'JSON' });
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        throw err;
      }
      console.error('Error generating report:', err);
      throw new InternalServerErrorException('Failed to generate report.');
    }
  }
}
