import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { EventManagerService } from './event-manager.service';
import { UpdateEventConfigDto } from './dto/update-event-config.dto';
import { AssignCoordinatorDto } from './dto/assign-coordinator.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { IssueInvitationDto } from './dto/issue-invitation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Event Manager')
@Controller('event-manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EVENT_MANAGER')
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires EVENT_MANAGER)' })
export class EventManagerController {
  constructor(private readonly service: EventManagerService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Manager Dashboard Metrics', description: 'Retrieve event preparation stats, priority items, and readiness overview' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics returned' })
  async getDashboard() {
    return this.service.getDashboard();
  }

  @Get('events')
  @ApiOperation({ summary: 'Get Assigned Events', description: 'Retrieve list of events assigned to or claimable by Event Manager' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
  @ApiResponse({ status: 200, description: 'Assigned events list returned' })
  async getEvents(@Query() query: any) {
    return this.service.getEvents(query);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get Event Workspace Details', description: 'Retrieve detailed event workspace and auto-assign manager if unassigned' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Workspace details returned' })
  async getEventDetails(@Param('id') id: string, @Req() req: any) {
    return this.service.getEventDetails(id, req.user);
  }

  @Put('events/:id/configuration')
  @ApiOperation({ summary: 'Update Event Configuration', description: 'Update registration status, deadline, and capacity settings' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Event configuration updated' })
  @ApiResponse({ status: 400, description: 'Invalid configuration attempt or ticket price modification rejected' })
  async updateConfiguration(
    @Param('id') id: string,
    @Body() dto: UpdateEventConfigDto,
    @Req() req: any,
  ) {
    return this.service.updateConfiguration(id, dto, req.user);
  }

  @Get('onsite-coordinators')
  @ApiOperation({ summary: 'List Onsite Coordinators', description: 'Retrieve list of active staff members available for onsite coordinator assignment' })
  @ApiResponse({ status: 200, description: 'Coordinators list returned' })
  async getCoordinators() {
    return this.service.getCoordinators();
  }

  @Post('events/:id/assign-coordinator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign Onsite Coordinator', description: 'Assign an onsite coordinator user to manage event operations' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Onsite coordinator assigned successfully' })
  async assignCoordinator(
    @Param('id') id: string,
    @Body() dto: AssignCoordinatorDto,
    @Req() req: any,
  ) {
    return this.service.assignCoordinator(id, dto, req.user);
  }

  @Get('events/:id/readiness')
  @ApiOperation({ summary: 'Get Operational Readiness', description: 'Calculate 6-item authoritative operational readiness checklist' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Readiness checklist breakdown returned' })
  async getReadiness(@Param('id') id: string) {
    return this.service.getReadiness(id);
  }

  @Post('events/:id/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark Event Operational Ready', description: 'Transition operational status to READY when readiness reaches 100%' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Event operational status set to READY' })
  async markEventReady(@Param('id') id: string, @Req() req: any) {
    return this.service.markEventReady(id, req.user);
  }

  @Post('events/:id/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue Private Invitation', description: 'Generate and send a private invitation code to a VIP attendee' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 201, description: 'Invitation issued successfully' })
  async issueInvitation(
    @Param('id') id: string,
    @Body() dto: IssueInvitationDto,
    @Req() req: any,
  ) {
    return this.service.issueInvitation(id, dto, req.user);
  }

  @Post('invitations/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke Invitation', description: 'Revoke a previously issued invitation code' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(@Param('id') id: string) {
    return this.service.revokeInvitation(id);
  }

  @Get('events/:id/sessions')
  @ApiOperation({ summary: 'Get Event Sessions', description: 'Retrieve list of agenda sessions for an event' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Sessions list returned' })
  async getSessions(@Param('id') id: string) {
    return this.service.getSessions(id);
  }

  @Post('events/:id/sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Event Session', description: 'Add a new breakout session or agenda item to the event' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  async createSession(
    @Param('id') id: string,
    @Body() dto: CreateSessionDto,
    @Req() req: any,
  ) {
    return this.service.createSession(id, dto, req.user);
  }
}
