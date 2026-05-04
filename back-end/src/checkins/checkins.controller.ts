import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiHeader, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { CheckInsService } from './checkins.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('check-ins')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly svc: CheckInsService) {}

  @Get()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.OSC, Role.CLIENT)
  @ApiOperation({ summary: 'List all check-ins', description: 'Filter by eventId or attendeeId. Accessible by superuser, eventmanager, client, osc.' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | osc)', required: true })
  @ApiQuery({ name: 'eventId',    required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'attendeeId', required: false, description: 'Filter by attendee ID' })
  @ApiResponse({ status: 200, description: 'List of check-ins returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  findAll(@Query('eventId') eventId?: string, @Query('attendeeId') attendeeId?: string) {
    return this.svc.findAll(eventId, attendeeId);
  }

  @Get(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.OSC, Role.CLIENT)
  @ApiOperation({ summary: 'Get a check-in by ID' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | osc)', required: true })
  @ApiResponse({ status: 200, description: 'Check-in record returned' })
  @ApiResponse({ status: 404, description: 'Check-in not found' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.OSC)
  @ApiOperation({ summary: 'Create a new check-in record', description: 'Pass status="checked-in" to mark as arrived immediately.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | osc', required: true, example: 'osc' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['eventId', 'attendeeId', 'attendeeEmail', 'attendeeName', 'ticketCode'],
      properties: {
        eventId:       { type: 'string', example: 'e1' },
        attendeeId:    { type: 'string', example: 'u8' },
        attendeeEmail: { type: 'string', example: 'rahul.s@gmail.com' },
        attendeeName:  { type: 'string', example: 'Rahul Sharma' },
        ticketCode:    { type: 'string', example: 'TKT00006' },
        status:        { type: 'string', example: 'checked-in', enum: ['pending', 'checked-in'], description: 'Pass checked-in to mark as arrived immediately' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Check-in created' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | osc can create check-ins' })
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Patch(':id/check-in')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.OSC)
  @ApiOperation({ summary: 'Mark a check-in as completed (attendee has arrived)' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | osc', required: true, example: 'osc' })
  @ApiResponse({ status: 200, description: 'Check-in marked as completed' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | osc can mark check-ins' })
  @ApiResponse({ status: 409, description: 'Already checked in' })
  checkIn(@Param('id') id: string) { return this.svc.checkIn(id); }

  @Delete(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Delete a check-in record' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'Check-in deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager can delete check-ins' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
