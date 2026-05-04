import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiHeader, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { PollResponsesService } from './poll-responses.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('poll-responses')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('poll-responses')
export class PollResponsesController {
  constructor(private readonly svc: PollResponsesService) {}

  @Get()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT, Role.ATTENDEE)
  @ApiOperation({ summary: 'List poll responses', description: 'Filter by pollId or attendeeId. Accessible by eventmanager, client, attendee, superuser.' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | attendee)', required: true })
  @ApiQuery({ name: 'pollId',     required: false, description: 'Filter by poll ID (e.g. poll1)' })
  @ApiQuery({ name: 'attendeeId', required: false, description: 'Filter by attendee ID (e.g. u8)' })
  @ApiResponse({ status: 200, description: 'List of poll responses returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  findAll(@Query('pollId') pollId?: string, @Query('attendeeId') attendeeId?: string) {
    return this.svc.findAll(pollId, attendeeId);
  }

  @Get('results/:pollId')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get tallied results for a poll', description: 'Returns the total response count and a per-answer tally.' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | attendee)', required: true })
  @ApiResponse({ status: 200, description: 'Poll results with tally returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  results(@Param('pollId') pollId: string) { return this.svc.results(pollId); }

  @Get(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get a poll response by ID' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | attendee)', required: true })
  @ApiResponse({ status: 200, description: 'Poll response returned' })
  @ApiResponse({ status: 404, description: 'Poll response not found' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(Role.SUPERUSER, Role.ATTENDEE)
  @ApiOperation({ summary: 'Submit an answer to a poll', description: 'Each attendee can only respond once per poll. Duplicate responses are rejected.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | attendee', required: true, example: 'attendee' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['pollId', 'attendeeId', 'attendeeEmail', 'answer'],
      properties: {
        pollId:        { type: 'string', example: 'poll1',            description: 'ID of the poll being answered' },
        attendeeId:    { type: 'string', example: 'u8',               description: 'ID of the attendee (user)' },
        attendeeEmail: { type: 'string', example: 'rahul.s@gmail.com' },
        answer:        { type: 'string', example: 'Machine Learning', description: 'The selected poll option text' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Poll response submitted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | attendee can submit poll responses' })
  @ApiResponse({ status: 409, description: 'Attendee has already responded to this poll' })
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Delete(':id')
  @Roles(Role.SUPERUSER)
  @ApiOperation({ summary: 'Delete a poll response', description: 'Only superuser can delete poll responses.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser', required: true, example: 'superuser' })
  @ApiResponse({ status: 200, description: 'Poll response deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser can delete poll responses' })
  @ApiResponse({ status: 404, description: 'Poll response not found' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
