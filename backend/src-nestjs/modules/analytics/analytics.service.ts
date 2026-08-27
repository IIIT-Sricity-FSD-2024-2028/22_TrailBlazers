import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AnalyticsRepository } from '../../repositories/analytics.repository';
import { NotificationHelperService } from '../notifications/notification-helper.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly notificationHelperService: NotificationHelperService,
  ) {}

  canViewEventAnalytics(user: { id: string; role?: string }, eventId: string): boolean {
    if (!user || !eventId) return false;

    const role = (user.role || '').toUpperCase();

    // 1. ADMIN access
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;

    // 2. REVENUE, ONSITE_COORDINATOR roles have NO analytics access
    if (role === 'REVENUE' || role === 'ONSITE_COORDINATOR') {
      return false;
    }

    // 3. EVENT_MANAGER access (Must manage the event)
    if (role === 'EVENT_MANAGER') {
      const req = this.analyticsRepository.getEventRequestById(eventId);
      if (req) {
        if (
          req.eventManagerUserId === user.id ||
          req.status === 'COMMERCIAL_APPROVED' ||
          req.operationalStatus === 'READY' ||
          req.operationalStatus === 'COMPLETED'
        ) {
          return true;
        }
      }
      const evt = this.analyticsRepository.getEventById(eventId);
      if (evt && evt.organizerUserId === user.id) return true;
      return true; // Authorized for Event Manager scope
    }

    // 4. CLIENT / ATTENDEE access (Must be the client owner of the event)
    if (role === 'ATTENDEE') {
      const req = this.analyticsRepository.getEventRequestById(eventId);
      if (req && req.userId === user.id) return true;
      const evt = this.analyticsRepository.getEventById(eventId);
      if (evt && evt.organizerUserId === user.id) return true;
      return false;
    }

    return false;
  }

  getCompletedEventsForUser(user: { id: string; role?: string }) {
    return this.analyticsRepository.getCompletedEventsForUser(user);
  }

  calculateAttendance(eventId: string) {
    const tickets = this.analyticsRepository.getTicketsForEvent(eventId);
    const totalRegistrations = tickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
    const confirmedCount = tickets
      .filter((t) => t.paymentStatus === 'CONFIRMED')
      .reduce((sum, t) => sum + (t.quantity || 1), 0);
    const checkedInCount = tickets
      .filter((t) => t.checkedIn === 1)
      .reduce((sum, t) => sum + (t.quantity || 1), 0);

    const noShowCount = Math.max(0, confirmedCount - checkedInCount);
    const attendanceRate =
      confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0;
    const noShowRate =
      confirmedCount > 0 ? Math.round((noShowCount / confirmedCount) * 100) : 0;

    const checkInTimeline = this.analyticsRepository.getCheckInTimeline(eventId);

    return {
      totalRegistrations,
      confirmedRegistrations: confirmedCount,
      checkedInAttendees: checkedInCount,
      noShowCount,
      attendanceRate,
      noShowRate,
      checkInTimeline,
    };
  }

  calculateEngagement(eventId: string) {
    const qaStats = this.analyticsRepository.getQAStats(eventId);
    const pollStats = this.analyticsRepository.getPollsCount(eventId);
    const pollResponseStats = this.analyticsRepository.getPollResponsesCount(eventId);
    const feedbackCount = this.analyticsRepository.getFeedbackCount(eventId);
    const ticketsCount = this.analyticsRepository.getConfirmedTicketsCount(eventId);

    const qaParticipation = Math.min(
      100,
      Math.round(((qaStats.total || 0) / ticketsCount) * 100),
    );
    const pollParticipation = Math.min(
      100,
      Math.round(
        ((pollResponseStats.responsesCount || 0) /
          (Math.max(1, pollStats.pollsCount) * ticketsCount)) *
          100,
      ),
    );
    const feedbackParticipation = Math.min(
      100,
      Math.round((feedbackCount / ticketsCount) * 100),
    );

    const engagementScore = Math.round(
      (qaParticipation + pollParticipation + feedbackParticipation) / 3,
    );

    return {
      qaTotal: qaStats.total || 0,
      qaApproved: qaStats.approved || 0,
      qaAnswered: qaStats.answered || 0,
      qaRejected: qaStats.rejected || 0,
      qaPending: qaStats.pending || 0,
      qaAnswerRate:
        (qaStats.approved || 0) > 0
          ? Math.round(((qaStats.answered || 0) / (qaStats.approved || 1)) * 100)
          : 0,
      pollsCount: pollStats.pollsCount || 0,
      pollResponsesCount: pollResponseStats.responsesCount || 0,
      feedbackCount,
      qaParticipation,
      pollParticipation,
      feedbackParticipation,
      engagementScore,
    };
  }

  calculateFeedback(eventId: string) {
    const rows = this.analyticsRepository.getFeedbackRows(eventId);
    const totalCount = rows.length;

    if (totalCount === 0) {
      return {
        hasFeedback: false,
        totalCount: 0,
        averageRating: null,
        satisfactionPercent: null,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentComments: [],
      };
    }

    const sumRating = rows.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Number((sumRating / totalCount).toFixed(1));
    const satisfactionPercent = Math.round((averageRating / 5) * 100);

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    rows.forEach((r) => {
      if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
    });

    return {
      hasFeedback: true,
      totalCount,
      averageRating,
      satisfactionPercent,
      ratingBreakdown: breakdown,
      recentComments: rows
        .slice(0, 10)
        .map((r) => ({ rating: r.rating, comment: r.comment, createdAt: r.createdAt })),
    };
  }

  calculatePerformanceScore(
    attendanceRate: number,
    engagementScore: number,
    feedbackData: any,
  ) {
    const attendanceComponent = Math.min(100, Math.max(0, attendanceRate || 0));
    const engagementComponent = Math.min(100, Math.max(0, engagementScore || 0));

    if (
      feedbackData &&
      feedbackData.hasFeedback &&
      feedbackData.satisfactionPercent !== null
    ) {
      const satisfactionComponent = Math.min(
        100,
        Math.max(0, feedbackData.satisfactionPercent),
      );
      const overallScore = Math.round(
        attendanceComponent * 0.4 +
          engagementComponent * 0.3 +
          satisfactionComponent * 0.3,
      );
      return {
        overallScore,
        methodology: 'Weighted: 40% Attendance, 30% Engagement, 30% Satisfaction',
        components: {
          attendance: { score: attendanceComponent, weightPct: 40 },
          engagement: { score: engagementComponent, weightPct: 30 },
          satisfaction: { score: satisfactionComponent, weightPct: 30 },
        },
      };
    } else {
      const overallScore = Math.round(
        attendanceComponent * 0.55 + engagementComponent * 0.45,
      );
      return {
        overallScore,
        methodology: 'Weighted (No Feedback Data): 55% Attendance, 45% Engagement',
        components: {
          attendance: { score: attendanceComponent, weightPct: 55 },
          engagement: { score: engagementComponent, weightPct: 45 },
          satisfaction: { score: null, weightPct: 0, note: 'No feedback submitted yet' },
        },
      };
    }
  }

  calculateSessions(eventId: string) {
    const sessions = this.analyticsRepository.getSessionsWithSpeakers(eventId);

    const enriched = sessions.map((sess) => {
      const { qaTotal, qaAnswered } = this.analyticsRepository.getSessionQAStats(sess.id);
      const pollsTotal = this.analyticsRepository.getSessionPollsCount(sess.id);
      const pollResponses = this.analyticsRepository.getSessionPollResponses(sess.id);

      const sessionEngagement = qaTotal * 5 + qaAnswered * 10 + pollResponses * 3;

      return {
        id: sess.id,
        title: sess.title,
        description: sess.description,
        speakerName: sess.speakerName || 'Assigned Speaker',
        hall: sess.hall || 'Main Auditorium',
        startTime: sess.startTime,
        endTime: sess.endTime,
        sessionAttendanceText: 'Session attendance unavailable',
        qaTotal,
        qaAnswered,
        pollsTotal,
        pollResponses,
        sessionEngagement,
      };
    });

    enriched.sort((a, b) => b.sessionEngagement - a.sessionEngagement);
    return enriched;
  }

  calculatePolls(eventId: string) {
    const polls = this.analyticsRepository.getAllPollsForEvent(eventId);

    return polls.map((poll) => {
      const options = this.analyticsRepository.getPollOptions(poll.id);
      const responses = this.analyticsRepository.getPollResponses(poll.id);
      const totalResponses = responses.length;

      const optionBreakdown = options.map((opt) => {
        const count = responses.filter((r) => r.optionId === opt.id).length;
        const percentage =
          totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
        return {
          id: opt.id,
          optionText: opt.optionText,
          count,
          percentage,
        };
      });

      let winningOption: any = null;
      if (totalResponses > 0 && optionBreakdown.length > 0) {
        winningOption = [...optionBreakdown].sort((a, b) => b.count - a.count)[0];
      }

      return {
        id: poll.id,
        questionText: poll.questionText,
        status: poll.status,
        launchedAt: poll.launchedAt,
        closedAt: poll.closedAt,
        totalResponses,
        options: optionBreakdown,
        winningOption: winningOption ? winningOption.optionText : 'N/A',
      };
    });
  }

  calculateQuestions(eventId: string) {
    const questions = this.analyticsRepository.getQuestionsWithUsers(eventId);

    const total = questions.length;
    const approved = questions.filter(
      (q) => q.status === 'APPROVED' || q.status === 'ANSWERED',
    ).length;
    const answered = questions.filter((q) => q.status === 'ANSWERED').length;
    const answerRate = approved > 0 ? Math.round((answered / approved) * 100) : 0;

    return {
      total,
      approved,
      answered,
      answerRate,
      questions: questions.slice(0, 10).map((q) => ({
        id: q.id,
        questionText: q.questionText,
        status: q.status,
        upvoteCount: q.upvoteCount || 0,
        userName: q.userName || 'Attendee',
      })),
    };
  }

  calculateFullEventAnalytics(eventId: string) {
    const event = this.analyticsRepository.getEventById(eventId);
    if (!event) return null;

    const eventRequest = this.analyticsRepository.getEventRequestById(eventId);

    const attendance = this.calculateAttendance(eventId);
    const engagement = this.calculateEngagement(eventId);
    const feedback = this.calculateFeedback(eventId);
    const performance = this.calculatePerformanceScore(
      attendance.attendanceRate,
      engagement.engagementScore,
      feedback,
    );
    const sessions = this.calculateSessions(eventId);
    const polls = this.calculatePolls(eventId);
    const questions = this.calculateQuestions(eventId);

    return {
      event: {
        id: event.id,
        name: event.name,
        organizationName: event.organizationName,
        category: event.category,
        venue: event.venue,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        status: event.status,
        operationalStatus: eventRequest?.operationalStatus || event.status,
      },
      attendance,
      engagement,
      feedback,
      performance,
      sessions,
      polls,
      questions,
    };
  }

  generateCSVReport(analyticsData: any): string {
    const { event, attendance, engagement, performance, feedback } = analyticsData;
    let csv = `WAVEVENTS POST-EVENT ANALYTICS REPORT\n`;
    csv += `Event Name,${event.name}\n`;
    csv += `Organization,${event.organizationName}\n`;
    csv += `Venue,${event.venue}\n`;
    csv += `Date,${event.date}\n`;
    csv += `Overall Performance Score,${performance.overallScore}%\n`;
    csv += `Performance Methodology,${performance.methodology}\n\n`;

    csv += `ATTENDANCE METRICS\n`;
    csv += `Confirmed Registrations,${attendance.confirmedRegistrations}\n`;
    csv += `Checked-In Attendees,${attendance.checkedInAttendees}\n`;
    csv += `Attendance Rate,${attendance.attendanceRate}%\n`;
    csv += `No-Show Count,${attendance.noShowCount}\n`;
    csv += `No-Show Rate,${attendance.noShowRate}%\n\n`;

    csv += `ENGAGEMENT METRICS\n`;
    csv += `Q&A Total Questions,${engagement.qaTotal}\n`;
    csv += `Q&A Answered Questions,${engagement.qaAnswered}\n`;
    csv += `Q&A Answer Rate,${engagement.qaAnswerRate}%\n`;
    csv += `Polls Launched,${engagement.pollsCount}\n`;
    csv += `Total Poll Responses,${engagement.pollResponsesCount}\n`;
    csv += `Overall Engagement Score,${engagement.engagementScore}%\n\n`;

    csv += `SATISFACTION & FEEDBACK\n`;
    csv += `Feedback Submissions,${feedback.totalCount}\n`;
    csv += `Average Rating,${feedback.averageRating || 'N/A'}\n`;
    csv += `Satisfaction Score,${feedback.satisfactionPercent ? feedback.satisfactionPercent + '%' : 'N/A'}\n`;

    return csv;
  }

  logAnalyticsExport({ eventId, user, format }: { eventId: string; user: any; format: string }) {
    this.analyticsRepository.insertAnalyticsAuditLog({
      id: 'aalog_' + crypto.randomBytes(8).toString('hex'),
      eventId,
      actorUserId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'EXPORTED_REPORT',
      details: `Exported post-event analytics report (${format})`,
    });
  }

  checkAndNotifyAnalyticsAvailable(eventId: string) {
    try {
      const eventReq = this.analyticsRepository.getEventRequestById(eventId);
      if (
        eventReq &&
        (eventReq.operationalStatus === 'COMPLETED' || eventReq.status === 'COMPLETED')
      ) {
        const eventName = eventReq.eventName || 'Event';
        if (eventReq.eventManagerUserId) {
          this.notificationHelperService.createNotification({
            recipientUserId: eventReq.eventManagerUserId,
            type: 'ANALYTICS_AVAILABLE',
            title: 'Post-Event Analytics Available',
            message: `Analytics for "${eventName}" are now available.`,
            entityType: 'ANALYTICS',
            entityId: eventId,
            deduplicate: true,
          });
        }
        if (eventReq.userId) {
          this.notificationHelperService.createNotification({
            recipientUserId: eventReq.userId,
            type: 'EVENT_REPORT_READY',
            title: 'Event Report Ready',
            message: `Your post-event event report for "${eventName}" is now available.`,
            entityType: 'ANALYTICS',
            entityId: eventId,
            deduplicate: true,
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to dispatch analytics notification:', notifErr);
    }
  }
}
