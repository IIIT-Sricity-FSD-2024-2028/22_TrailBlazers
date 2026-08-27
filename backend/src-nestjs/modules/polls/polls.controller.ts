import {
  Controller,
  Get,
  Post,
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
import { PollsService } from './polls.service';
import { RespondToPollDto } from './dto/respond-to-poll.dto';
import { CreateSessionPollDto } from './dto/create-session-poll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Polls')
@Controller('events')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get(':id/polls/active')
  @ApiOperation({ summary: 'Get Active Event Polls', description: 'Retrieve currently launched live polls and option choices for an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Active polls list returned' })
  async getActivePolls(@Param('id') id: string) {
    return this.pollsService.getActivePolls(id);
  }

  @Post('polls/session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'EVENT_MANAGER', 'ONSITE_COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role (CLIENT, EVENT_MANAGER, ONSITE_COORDINATOR)' })
  @ApiOperation({ summary: 'Create Session Poll', description: 'Create a new poll associated with a specific event session' })
  @ApiResponse({ status: 201, description: 'Session poll created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid poll data or options count < 2' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not own or manage this event' })
  async createSessionPoll(
    @Body() dto: CreateSessionPollDto,
    @Req() req: any,
  ) {
    return this.pollsService.createSessionPoll(dto, req.user);
  }

  @Get(':eventId/sessions/:sessionId/polls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT', 'EVENT_MANAGER', 'ONSITE_COORDINATOR', 'SUPER_ADMIN', 'ADMIN', 'ATTENDEE')
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role for evaluation' })
  @ApiOperation({ summary: 'Get Session Polls', description: 'Retrieve polls and response statistics for a specific event session' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session polls list returned' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not own or manage this event' })
  async getSessionPolls(
    @Param('eventId') eventId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
    return this.pollsService.getSessionPolls(eventId, sessionId, req.user);
  }

  @Post('polls/:id/respond')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role (ATTENDEE)' })
  @ApiOperation({ summary: 'Respond to Live Poll', description: 'Submit poll option response' })
  @ApiParam({ name: 'id', description: 'Poll ID' })
  @ApiResponse({ status: 201, description: 'Poll response submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid option ID or poll not active' })
  @ApiResponse({ status: 403, description: 'Access denied. Must be registered for event' })
  async respondToPoll(
    @Param('id') id: string,
    @Body() dto: RespondToPollDto,
    @Req() req: any,
  ) {
    return this.pollsService.respondToPoll(id, dto, req.user);
  }
}

