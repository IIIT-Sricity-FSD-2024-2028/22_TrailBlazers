import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiHeader, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('reports')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'List all reports', description: 'Filter by eventId. Accessible by superuser and eventmanager and client only.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  @ApiResponse({ status: 200, description: 'List of reports returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can list reports' })
  findAll(@Query('eventId') eventId?: string) { return this.svc.findAll(eventId); }

  @Get('event/:eventId')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Get the analytics report for a specific event' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'Report returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can view event reports' })
  @ApiResponse({ status: 404, description: 'No report found for this event' })
  findByEvent(@Param('eventId') eventId: string) { return this.svc.findByEvent(eventId); }

  @Get(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'Report returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can view reports' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Generate a new post-event analytics report', description: 'Creates a report with attendance, poll participation and feedback metrics.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['eventId'],
      properties: {
        eventId:           { type: 'string', example: 'e1',  description: 'ID of the event to report on' },
        attendanceCount:   { type: 'number', example: 342,   description: 'Total attendees who checked in' },
        pollParticipation: { type: 'number', example: 120,   description: 'Number of attendees who voted in polls' },
        feedbackScore:     { type: 'number', example: 4.5,   description: 'Average feedback rating (1–5)' },
        checkInRate:       { type: 'number', example: 85,    description: 'Percentage of RSVPs who checked in' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Report generated' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager can generate reports' })
  generate(@Body() dto: any) { return this.svc.generate(dto); }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Update report metrics' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        attendanceCount:   { type: 'number', example: 350 },
        pollParticipation: { type: 'number', example: 130 },
        feedbackScore:     { type: 'number', example: 4.7 },
        checkInRate:       { type: 'number', example: 88 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Report updated' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager can update reports' })
  update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }

  @Delete(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager can delete reports' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
