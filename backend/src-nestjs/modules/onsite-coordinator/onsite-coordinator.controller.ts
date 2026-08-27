import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
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
import { OnsiteCoordinatorService } from './onsite-coordinator.service';
import { CheckInDto } from './dto/check-in.dto';
import { UpdateOperationalStatusDto } from './dto/update-operational-status.dto';
import { ReportIssueDto } from './dto/report-issue.dto';
import { UpdateIssueStatusDto } from './dto/update-issue-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Onsite Coordinator')
@Controller('onsite-coordinator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ONSITE_COORDINATOR')
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires ONSITE_COORDINATOR)' })
export class OnsiteCoordinatorController {
  constructor(private readonly service: OnsiteCoordinatorService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Coordinator Dashboard', description: 'Retrieve stats on assigned events, todays events, and checked-in attendees' })
  @ApiResponse({ status: 200, description: 'Coordinator dashboard metrics returned' })
  async getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get Assigned Events', description: 'Retrieve filterable assigned events for onsite management' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'filter', required: false, description: 'Filter by status (TODAY, LIVE, COMPLETED)' })
  @ApiResponse({ status: 200, description: 'Assigned events list returned' })
  async getEvents(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    return this.service.getEvents(req.user, search, filter);
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get Workspace Event Details', description: 'Retrieve event details, stats, and recent check-ins' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event workspace details returned' })
  async getEventWorkspace(@Param('id') id: string, @Req() req: any) {
    return this.service.getEventWorkspace(id, req.user);
  }

  @Post('events/:id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check In Attendee', description: 'Process QR/ticket check-in with duplicate protection and audit log' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Check-in successful' })
  @ApiResponse({ status: 400, description: 'Attendee ALREADY checked in or wrong event ticket' })
  @ApiResponse({ status: 404, description: 'Invalid ticket' })
  async checkInAttendee(
    @Param('id') id: string,
    @Body() dto: CheckInDto,
    @Req() req: any,
  ) {
    return this.service.checkInAttendee(id, dto, req.user);
  }

  @Get('events/:id/attendees')
  @ApiOperation({ summary: 'Get Attendees List', description: 'Retrieve attendee check-in roster for the assigned event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search attendee name or ticket number' })
  @ApiResponse({ status: 200, description: 'Attendees list returned' })
  async getAttendees(
    @Param('id') id: string,
    @Req() req: any,
    @Query('search') search?: string,
  ) {
    return this.service.getAttendees(id, req.user, search);
  }

  @Post('events/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Operational Status', description: 'Transition event status (CHECK_IN_OPEN, LIVE, COMPLETED) and notify stakeholders' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Operational status updated' })
  async updateOperationalStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOperationalStatusDto,
    @Req() req: any,
  ) {
    return this.service.updateOperationalStatus(id, dto, req.user);
  }

  @Get('events/:id/issues')
  @ApiOperation({ summary: 'Get Operational Issues', description: 'Retrieve list of logged operational issues for an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Issues list returned' })
  async getIssues(@Param('id') id: string, @Req() req: any) {
    return this.service.getIssues(id, req.user);
  }

  @Post('events/:id/issues')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report Operational Issue', description: 'Report technical or logistical issue and alert Event Manager' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Issue reported successfully' })
  async reportIssue(
    @Param('id') id: string,
    @Body() dto: ReportIssueDto,
    @Req() req: any,
  ) {
    return this.service.reportIssue(id, dto, req.user);
  }

  @Put('issues/:id/status')
  @ApiOperation({ summary: 'Update Issue Resolution Status', description: 'Update issue status (OPEN, IN_PROGRESS, RESOLVED)' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({ status: 200, description: 'Issue status updated' })
  async updateIssueStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIssueStatusDto,
    @Req() req: any,
  ) {
    return this.service.updateIssueStatus(id, dto, req.user);
  }
}
