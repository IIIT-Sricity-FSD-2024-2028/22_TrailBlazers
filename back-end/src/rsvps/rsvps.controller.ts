import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { RsvpsService } from './rsvps.service';
import { CreateRsvpDto, UpdateRsvpDto } from './dto/rsvp.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('RSVPs')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('rsvps')
export class RsvpsController {
  constructor(private readonly rsvpsService: RsvpsService) {}

  @Get()
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get all RSVPs', description: 'Accessible by superuser, eventmanager, client, and OSC.' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'confirmed', 'cancelled', 'attended'] })
  @ApiResponse({ status: 200, description: 'RSVP list' })
  findAll(@Query('eventId') eventId?: string, @Query('status') status?: string) {
    return this.rsvpsService.findAll(eventId, status);
  }

  @Get('my')
  @Roles(Role.ATTENDEE)
  @ApiOperation({ summary: "Get my RSVPs by email", description: 'Attendee fetches their own RSVPs by email query param.' })
  @ApiHeader({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' })
  @ApiQuery({ name: 'email', required: true, description: 'Attendee email' })
  @ApiResponse({ status: 200, description: 'User RSVPs' })
  findMyRsvps(@Query('email') email: string) {
    return this.rsvpsService.findByEmail(email);
  }

  @Get(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC, Role.ATTENDEE)
  @ApiOperation({ summary: 'Get RSVP by ID' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true })
  @ApiParam({ name: 'id', description: 'RSVP ID' })
  @ApiResponse({ status: 200, description: 'RSVP details' })
  @ApiResponse({ status: 404, description: 'RSVP not found' })
  findOne(@Param('id') id: string) {
    return this.rsvpsService.findOne(id);
  }

  @Post()
  @Roles(Role.ATTENDEE)
  @ApiOperation({ summary: 'Create RSVP (Register for an event)', description: 'Attendee registers for an event. Phone must be exactly 10 digits.' })
  @ApiHeader({ name: 'role', description: 'Must be: attendee', required: true, example: 'attendee' })
  @ApiResponse({ status: 201, description: 'RSVP created — returns ticket code' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid phone' })
  @ApiResponse({ status: 409, description: 'Already registered for this event' })
  create(@Body() dto: CreateRsvpDto) {
    return this.rsvpsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC, Role.ATTENDEE)
  @ApiOperation({ summary: 'Update RSVP status', description: 'Update RSVP details or status. Attendees can cancel their own; OSC/eventmanager/client can update any.' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc | attendee', required: true })
  @ApiParam({ name: 'id', description: 'RSVP ID' })
  @ApiResponse({ status: 200, description: 'RSVP updated' })
  update(@Param('id') id: string, @Body() dto: UpdateRsvpDto) {
    return this.rsvpsService.update(id, dto);
  }

  @Post('checkin/:ticketCode')
  @Roles(Role.OSC, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Check-in attendee by ticket code', description: 'OSC scanner endpoint — validates and marks ticket as attended.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | osc | eventmanager | client', required: true, example: 'osc' })
  @ApiParam({ name: 'ticketCode', description: 'Ticket code (e.g. TKT00001)', example: 'TKT00001' })
  @ApiResponse({ status: 201, description: 'Check-in successful' })
  @ApiResponse({ status: 404, description: 'Invalid ticket' })
  @ApiResponse({ status: 409, description: 'Already checked in' })
  checkIn(@Param('ticketCode') ticketCode: string) {
    return this.rsvpsService.checkIn(ticketCode);
  }

  @Delete(':id')
  @Roles(Role.EVENTMANAGER, Role.ATTENDEE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel / delete RSVP' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | attendee', required: true })
  @ApiParam({ name: 'id', description: 'RSVP ID' })
  @ApiResponse({ status: 200, description: 'RSVP cancelled' })
  remove(@Param('id') id: string) {
    return this.rsvpsService.remove(id);
  }
}
