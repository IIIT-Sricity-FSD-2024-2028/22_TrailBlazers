import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Query,
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
import { HierarchyService } from './hierarchy.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { AssignIssueDto } from './dto/assign-issue.dto';
import { EscalateIssueDto } from './dto/escalate-issue.dto';
import { ResolveIssueDto } from './dto/resolve-issue.dto';
import { EventAttendeeQueryDto } from './dto/event-attendee-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Hierarchy & Operational Issues')
@Controller('hierarchy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (SUPER_ADMIN, EVENT_MANAGER, ONSITE_COORDINATOR, etc.)' })
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get Operational Hierarchy Overview', description: 'Retrieve high-level organizational issue summary metrics' })
  @ApiResponse({ status: 200, description: 'Hierarchy overview returned' })
  async getOverview(@Req() req: any) {
    return this.hierarchyService.getOverview(req.user);
  }

  @Get('staff-activity')
  @ApiOperation({ summary: 'Search Staff Work Activity', description: 'Search and inspect real-time tasks, active assignments, and current workload for staff across all departments' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by staff name, email, or role' })
  @ApiQuery({ name: 'department', required: false, description: 'Filter by department' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiResponse({ status: 200, description: 'Enriched staff activity list returned' })
  async getStaffActivity(
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('role') role?: string,
  ) {
    return this.hierarchyService.getStaffActivity({ search, department, role });
  }

  @Get('revenue/events')
  @ApiOperation({ summary: 'Get Revenue Department Events & Ticket Sales', description: 'Retrieve all commercial events with total revenue and live ticket sales revenue breakdown' })
  @ApiResponse({ status: 200, description: 'Events revenue breakdown returned' })
  async getRevenueEvents() {
    return this.hierarchyService.getRevenueEvents();
  }

  @Get('team')
  @ApiOperation({ summary: 'Get Team Hierarchy Structure', description: 'Retrieve team organizational structure and assigned staff' })
  @ApiResponse({ status: 200, description: 'Team hierarchy returned' })
  async getTeam(@Req() req: any) {
    return this.hierarchyService.getTeam(req.user);
  }

  @Get('issues')
  @ApiOperation({ summary: 'Get Escalated Issues List', description: 'Retrieve active operational and technical issues scoped to user role' })
  @ApiResponse({ status: 200, description: 'Issues list returned' })
  async getIssues(@Req() req: any) {
    return this.hierarchyService.getIssues(req.user);
  }

  @Post('issues/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Operational Issue', description: 'Report a new organizational or technical issue' })
  @ApiResponse({ status: 201, description: 'Issue created successfully' })
  async createIssue(@Body() dto: CreateIssueDto, @Req() req: any) {
    return this.hierarchyService.createIssue(dto, req.user);
  }

  @Post('issues/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign Issue', description: 'Assign an operational issue to a staff member' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue assigned' })
  async assignIssue(
    @Param('id') id: string,
    @Body() dto: AssignIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.assignIssue(id, dto, req.user);
  }

  @Post('issues/:id/escalate-to-manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate Issue to Event Manager', description: 'Escalate issue to Event Manager level' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue escalated to Event Manager' })
  async escalateToManager(
    @Param('id') id: string,
    @Body() dto: EscalateIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.escalateToManager(id, dto, req.user);
  }

  @Post('issues/:id/escalate-to-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate Issue to Super Admin', description: 'Escalate issue to Super Admin level' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue escalated to Super Admin' })
  async escalateToAdmin(
    @Param('id') id: string,
    @Body() dto: EscalateIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.escalateToAdmin(id, dto, req.user);
  }

  @Post('issues/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve Operational Issue', description: 'Mark an issue as resolved' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue resolved' })
  async resolveIssue(
    @Param('id') id: string,
    @Body() dto: ResolveIssueDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.resolveIssue(id, dto, req.user);
  }

  @Get('events/awaiting-assignment')
  @ApiOperation({ summary: 'Get Events Awaiting Staff Assignment', description: 'Retrieve commercially approved events needing staff' })
  @ApiResponse({ status: 200, description: 'Awaiting assignment list returned' })
  async getAwaitingAssignmentEvents(@Req() req: any) {
    return this.hierarchyService.getAwaitingAssignmentEvents(req.user);
  }

  @Get('events/assigned')
  @ApiOperation({ summary: 'Get Assigned Events', description: 'Retrieve events that have been assigned to managers and coordinators' })
  @ApiResponse({ status: 200, description: 'Assigned list returned' })
  async getAssignedEvents(@Req() req: any) {
    return this.hierarchyService.getAssignedEvents(req.user);
  }

  @Get('staff/availability')
  @ApiOperation({ summary: 'Get Staff Availability', description: 'Check Event Manager and Onsite Coordinator availability for a given date/time slot' })
  @ApiQuery({ name: 'eventDate', required: false })
  @ApiQuery({ name: 'startTime', required: false })
  @ApiQuery({ name: 'endTime', required: false })
  @ApiResponse({ status: 200, description: 'Staff availability list returned' })
  async getStaffAvailability(
    @Query('eventDate') eventDate: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Req() req: any,
  ) {
    return this.hierarchyService.getStaffAvailability(req.user, eventDate, startTime, endTime);
  }

  @Post('events/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign Staff to Event', description: 'Assign or reassign Event Manager and Onsite Coordinator' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Staff assigned successfully' })
  async assignStaff(
    @Param('id') id: string,
    @Body() body: { eventManagerUserId?: string; onsiteCoordinatorUserId?: string },
    @Req() req: any,
  ) {
    return this.hierarchyService.assignStaff(id, body, req.user);
  }

  @Get('events/:id/attendees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get Event-Wise Attendees for Super Admin',
    description: 'Retrieve real-time attendee roster, ticket allocations, and registration metrics for a specific event',
  })
  @ApiParam({ name: 'id', description: 'Event Request ID or Event Unique ID' })
  @ApiResponse({ status: 200, description: 'Event attendees and summary metrics returned' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventAttendees(
    @Param('id') id: string,
    @Query() query: EventAttendeeQueryDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.getEventAttendees(id, query, req.user);
  }
}
