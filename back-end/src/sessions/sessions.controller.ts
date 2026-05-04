import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiHeader, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('sessions')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @Get()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT, Role.OSC, Role.ATTENDEE)
  @ApiOperation({ summary: 'List all sessions', description: 'Optionally filter by eventId. Returns sessions (agenda) for an event.' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | osc | attendee)', required: true })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter sessions by event ID (e.g. e1)' })
  @ApiResponse({ status: 200, description: 'List of sessions returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  findAll(@Query('eventId') eventId?: string) { return this.svc.findAll(eventId); }

  @Get(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT, Role.OSC, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get a session by ID' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | osc | attendee)', required: true })
  @ApiResponse({ status: 200, description: 'Session returned' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Create a new session for an event', description: 'Add a talk, panel, workshop, keynote or demo session to an event agenda.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['eventId', 'topic', 'startTime', 'endTime'],
      properties: {
        eventId:   { type: 'string', example: 'e1',                       description: 'ID of the parent event' },
        topic:     { type: 'string', example: 'Keynote: Future of AI' },
        startTime: { type: 'string', example: '2026-04-15T09:00:00.000Z', description: 'ISO 8601 start time' },
        endTime:   { type: 'string', example: '2026-04-15T10:00:00.000Z', description: 'ISO 8601 end time' },
        speaker:   { type: 'string', example: 'Dr. Ananya Gupta' },
        location:  { type: 'string', example: 'Main Auditorium' },
        type:      { type: 'string', example: 'keynote', enum: ['keynote', 'panel', 'workshop', 'demo', 'talk'] },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Session created' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can create sessions' })
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Update a session', description: 'Update topic, speaker, location, times or type of a session.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        topic:     { type: 'string', example: 'Updated Topic' },
        speaker:   { type: 'string', example: 'New Speaker Name' },
        location:  { type: 'string', example: 'Hall B' },
        startTime: { type: 'string', example: '2026-04-15T09:30:00.000Z' },
        endTime:   { type: 'string', example: '2026-04-15T10:30:00.000Z' },
        type:      { type: 'string', example: 'panel' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Session updated' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can update sessions' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Delete(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Delete a session' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can delete sessions' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
