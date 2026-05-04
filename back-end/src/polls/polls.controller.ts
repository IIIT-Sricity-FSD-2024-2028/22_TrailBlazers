import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { PollsService } from './polls.service';
import { CreatePollDto, VotePollDto, UpdatePollDto } from './dto/poll.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Polls')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  // ─── GET ALL POLLS ───────────────────────────────────────────────────────────
  @Get()
  @Roles(Role.CLIENT, Role.EVENTMANAGER, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get all polls', description: 'Returns polls, optionally filtered by event or status. Accessible by client, eventmanager, attendee, and superuser.' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | attendee', required: true })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'closed'], description: 'Filter by poll status' })
  @ApiResponse({ status: 200, description: 'Polls list returned' })
  findAll(@Query('eventId') eventId?: string, @Query('status') status?: string) {
    return this.pollsService.findAll(eventId, status);
  }

  // ─── GET POLL BY ID ──────────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.CLIENT, Role.EVENTMANAGER, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | attendee', required: true })
  @ApiParam({ name: 'id', description: 'Poll ID (e.g. poll1)' })
  @ApiResponse({ status: 200, description: 'Poll details' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  findOne(@Param('id') id: string) {
    return this.pollsService.findOne(id);
  }

  // ─── GET POLL RESULTS ────────────────────────────────────────────────────────
  @Get(':id/results')
  @Roles(Role.CLIENT, Role.EVENTMANAGER, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get poll results with vote percentages', description: 'Returns vote counts and percentage breakdown per option.' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | attendee', required: true })
  @ApiParam({ name: 'id', description: 'Poll ID' })
  @ApiResponse({ status: 200, description: 'Poll results with percentages' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  getResults(@Param('id') id: string) {
    return this.pollsService.getResults(id);
  }

  // ─── CREATE POLL ─────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.CLIENT, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Create a new poll', description: 'Client or eventmanager creates a poll for an event. Requires at least 2 options.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' })
  @ApiResponse({ status: 201, description: 'Poll created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreatePollDto) {
    return this.pollsService.create(dto);
  }

  // ─── VOTE ON POLL ────────────────────────────────────────────────────────────
  @Post(':id/vote')
  @Roles(Role.ATTENDEE)
  @ApiOperation({ summary: 'Vote on a poll', description: 'Attendee votes on an open poll. Each attendee (by email) can vote only once per poll.' })
  @ApiHeader({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' })
  @ApiParam({ name: 'id', description: 'Poll ID' })
  @ApiResponse({ status: 201, description: 'Vote registered successfully' })
  @ApiResponse({ status: 400, description: 'Poll is closed or invalid option' })
  @ApiResponse({ status: 409, description: 'Already voted' })
  vote(@Param('id') id: string, @Body() dto: VotePollDto) {
    return this.pollsService.vote(id, dto);
  }

  // ─── UPDATE POLL ─────────────────────────────────────────────────────────────
  @Patch(':id')
  @Roles(Role.CLIENT, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Update poll (question, options, or status)', description: 'Client or eventmanager can update a poll. Updating options resets vote counts.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' })
  @ApiParam({ name: 'id', description: 'Poll ID' })
  @ApiResponse({ status: 200, description: 'Poll updated' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePollDto) {
    return this.pollsService.update(id, dto);
  }

  // ─── CLOSE POLL ──────────────────────────────────────────────────────────────
  @Patch(':id/close')
  @Roles(Role.CLIENT, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Close a poll (stop accepting votes)', description: 'Client or eventmanager closes the poll.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' })
  @ApiParam({ name: 'id', description: 'Poll ID' })
  @ApiResponse({ status: 200, description: 'Poll closed' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  close(@Param('id') id: string) {
    return this.pollsService.close(id);
  }

  // ─── DELETE POLL ─────────────────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.CLIENT, Role.EVENTMANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a poll', description: 'Client or eventmanager permanently removes a poll.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | client | eventmanager', required: true, example: 'client' })
  @ApiParam({ name: 'id', description: 'Poll ID' })
  @ApiResponse({ status: 200, description: 'Poll deleted' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  remove(@Param('id') id: string) {
    return this.pollsService.remove(id);
  }
}
