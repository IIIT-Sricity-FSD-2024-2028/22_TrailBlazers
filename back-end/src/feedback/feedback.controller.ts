import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiHeader, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('feedback')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly svc: FeedbackService) {}

  @Get()
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'List all feedback', description: 'Filter by eventId or attendeeId. Accessible by superuser, eventmanager and client.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiQuery({ name: 'eventId',    required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'attendeeId', required: false, description: 'Filter by attendee user ID' })
  @ApiResponse({ status: 200, description: 'List of feedback returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can list feedback' })
  findAll(@Query('eventId') eventId?: string, @Query('attendeeId') attendeeId?: string) {
    return this.svc.findAll(eventId, attendeeId);
  }

  @Get('avg-rating/:eventId')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Get average rating for a specific event' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'Average rating returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can view ratings' })
  avgRating(@Param('eventId') eventId: string) { return this.svc.avgRating(eventId); }

  @Get(':id')
  @Roles(Role.SUPERUSER, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Get a feedback entry by ID' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 200, description: 'Feedback returned' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | eventmanager | client can view feedback' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles(Role.SUPERUSER, Role.ATTENDEE)
  @ApiOperation({ summary: 'Submit feedback for an event', description: 'Attendee submits a rating (1–5) and optional comment for an event they attended.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | attendee', required: true, example: 'attendee' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['eventId', 'attendeeId', 'attendeeEmail', 'rating'],
      properties: {
        eventId:       { type: 'string', example: 'e1' },
        attendeeId:    { type: 'string', example: 'u8' },
        attendeeEmail: { type: 'string', example: 'rahul.s@gmail.com' },
        rating:        { type: 'number', example: 5, description: 'Integer rating from 1 to 5' },
        comment:       { type: 'string', example: 'Excellent event! Very well organised.' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Feedback submitted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser | attendee can submit feedback' })
  @ApiResponse({ status: 409, description: 'Rating must be between 1 and 5' })
  create(@Body() dto: any) { return this.svc.create(dto); }

  @Delete(':id')
  @Roles(Role.SUPERUSER)
  @ApiOperation({ summary: 'Delete a feedback entry', description: 'Only superuser can delete feedback entries.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser', required: true, example: 'superuser' })
  @ApiResponse({ status: 200, description: 'Feedback deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Only superuser can delete feedback' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
