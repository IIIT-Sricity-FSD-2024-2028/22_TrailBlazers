import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { SubmitEventFeedbackDto } from './dto/submit-event-feedback.dto';
import { CreateFeedbackPollDto } from './dto/create-feedback-poll.dto';
import { RespondToFeedbackPollDto } from './dto/respond-to-feedback-poll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Feedback')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (ATTENDEE)' })
export class EventsFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post(':id/feedback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Event Rating Feedback', description: 'Submit 1-5 star rating and comment for a completed event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating or feedback already submitted' })
  @ApiResponse({ status: 403, description: 'Access denied. Only registered attendees can submit feedback' })
  async submitEventFeedback(
    @Param('id') id: string,
    @Body() dto: SubmitEventFeedbackDto,
    @Req() req: any,
  ) {
    return this.feedbackService.submitEventFeedback(id, dto, req.user);
  }
}

@ApiTags('Feedback Polls & Surveys')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (EVENT_MANAGER / ATTENDEE)' })
export class FeedbackPollsController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('polls')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Feedback Survey Poll', description: 'Draft a new post-event feedback survey with custom questions (Event Manager only)' })
  @ApiResponse({ status: 201, description: 'Feedback poll created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only Event Managers can create survey polls' })
  async createPoll(@Body() dto: CreateFeedbackPollDto, @Req() req: any) {
    return this.feedbackService.createPoll(dto, req.user);
  }

  @Get('polls/event/:eventId')
  @ApiOperation({ summary: 'Get Feedback Polls by Event', description: 'Retrieve feedback survey polls for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Polls list returned' })
  async getPollsByEvent(@Param('eventId') eventId: string, @Req() req: any) {
    return this.feedbackService.getPollsByEvent(eventId, req.user);
  }

  @Get('polls/attendee/my-polls')
  @ApiOperation({ summary: 'Get Attendee Survey Polls', description: 'Retrieve active feedback surveys available for registered events' })
  @ApiResponse({ status: 200, description: 'Attendee surveys list returned' })
  async getAttendeePolls(@Req() req: any) {
    return this.feedbackService.getAttendeePolls(req.user);
  }

  @Get('polls/:pollId/results')
  @ApiOperation({ summary: 'Get Survey Results', description: 'Retrieve response statistics and answer breakdowns for a survey poll' })
  @ApiParam({ name: 'pollId', description: 'Survey Poll ID' })
  @ApiResponse({ status: 200, description: 'Survey results returned' })
  async getPollResults(@Param('pollId') pollId: string, @Req() req: any) {
    return this.feedbackService.getPollResults(pollId, req.user);
  }

  @Get('polls/:pollId')
  @ApiOperation({ summary: 'Get Survey Poll Details', description: 'Retrieve questions and submission status for a survey poll' })
  @ApiParam({ name: 'pollId', description: 'Survey Poll ID' })
  @ApiResponse({ status: 200, description: 'Survey poll details returned' })
  async getPollDetails(@Param('pollId') pollId: string, @Req() req: any) {
    return this.feedbackService.getPollDetails(pollId, req.user);
  }

  @Post('polls/:pollId/publish')
  @ApiOperation({ summary: 'Publish Survey Poll', description: 'Publish a draft survey poll for attendee responses' })
  @ApiParam({ name: 'pollId', description: 'Survey Poll ID' })
  @ApiResponse({ status: 200, description: 'Survey poll published' })
  async publishPoll(@Param('pollId') pollId: string, @Req() req: any) {
    return this.feedbackService.publishPoll(pollId, req.user);
  }

  @Post('polls/:pollId/close')
  @ApiOperation({ summary: 'Close Survey Poll', description: 'Close an active survey poll to stop new submissions' })
  @ApiParam({ name: 'pollId', description: 'Survey Poll ID' })
  @ApiResponse({ status: 200, description: 'Survey poll closed' })
  async closePoll(@Param('pollId') pollId: string, @Req() req: any) {
    return this.feedbackService.closePoll(pollId, req.user);
  }

  @Delete('polls/:pollId')
  @ApiOperation({ summary: 'Delete Survey Poll', description: 'Remove a feedback survey poll and its questions' })
  @ApiParam({ name: 'pollId', description: 'Survey Poll ID' })
  @ApiResponse({ status: 200, description: 'Survey poll deleted' })
  async deletePoll(@Param('pollId') pollId: string, @Req() req: any) {
    return this.feedbackService.deletePoll(pollId, req.user);
  }

  @Post('polls/:pollId/respond')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Survey Answers', description: 'Submit attendee responses for survey questions' })
  @ApiParam({ name: 'pollId', description: 'Survey Poll ID' })
  @ApiResponse({ status: 201, description: 'Survey responses recorded successfully' })
  @ApiResponse({ status: 400, description: 'Already submitted or invalid answers' })
  async respondToPoll(
    @Param('pollId') pollId: string,
    @Body() dto: RespondToFeedbackPollDto,
    @Req() req: any,
  ) {
    return this.feedbackService.respondToPoll(pollId, dto, req.user);
  }
}
