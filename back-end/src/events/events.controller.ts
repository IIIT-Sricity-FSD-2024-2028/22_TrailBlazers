import {
  Controller,
  Get,
  Post,
  Put,
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
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Events')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ─── GET ALL EVENTS ─────────────────────────────────────────────────────────
  @Get()
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.ATTENDEE, Role.OSC)
  @ApiOperation({ summary: 'Get all events', description: 'Retrieve a list of all events. Supports filtering by status and managerId. Accessible by eventmanager, client, osc, attendee, superuser.' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | osc | attendee)', required: true })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status. Omit or leave empty to return all events.', enum: ['pending', 'upcoming', 'live', 'completed'] })
  @ApiQuery({ name: 'managerId', required: false, description: 'Filter by manager user ID (e.g. u1, u2). Pass a user ID, not a role name.' })
  @ApiResponse({ status: 200, description: 'List of events returned successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid role header' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  findAll(
    @Query('status') status?: string,
    @Query('managerId') managerId?: string,
  ) {
    return this.eventsService.findAll(status, managerId);
  }

  // ─── GET DASHBOARD STATS ─────────────────────────────────────────────────────
  @Get('stats/dashboard')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get dashboard statistics', description: 'Returns aggregate stats: total events, RSVPs, ratings, engagement scores.' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | osc)', required: true })
  @ApiQuery({ name: 'managerId', required: false, description: 'Filter stats for a specific manager' })
  @ApiResponse({ status: 200, description: 'Dashboard stats returned' })
  getDashboardStats(@Query('managerId') managerId?: string) {
    return this.eventsService.getDashboardStats(managerId);
  }

  // ─── GET ONE EVENT ───────────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.ATTENDEE, Role.OSC)
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiHeader({ name: 'role', description: 'User role (superuser | eventmanager | client | osc | attendee)', required: true })
  @ApiParam({ name: 'id', description: 'Event ID (e.g. e1)' })
  @ApiResponse({ status: 200, description: 'Event returned' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // ─── CREATE EVENT ────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Create a new event', description: 'Accessible by eventmanager and client. Superuser can also create events.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Only eventmanager or client can create events' })
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  // ─── UPDATE EVENT (full) ─────────────────────────────────────────────────────
  @Put(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Update event (full replace)', description: 'Full update of an event. Eventmanager and client only.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  // ─── PATCH EVENT (partial) ───────────────────────────────────────────────────
  @Patch(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Partially update event', description: 'Update specific fields. Eventmanager and client only. Use for status changes (e.g. pending → live).' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event patched' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  patch(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  // ─── DELETE EVENT ────────────────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.EVENTMANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete event', description: 'Permanently remove an event. Eventmanager only (or superuser).' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
