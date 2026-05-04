import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Teams')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get all team members' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'break', 'offline'] })
  @ApiResponse({ status: 200, description: 'Team members list' })
  findAll(@Query('eventId') eventId?: string, @Query('status') status?: string) {
    return this.service.findAll(eventId, status);
  }

  @Get(':eventId/stats')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get team statistics for an event' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Team stats' })
  getStats(@Param('eventId') eventId: string) {
    return this.service.getStats(eventId);
  }

  @Get(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get team member by ID' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiParam({ name: 'id', description: 'Team member ID' })
  @ApiResponse({ status: 200, description: 'Team member details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Add team member to event', description: 'Assign a new OSC staff member to an event. Eventmanager or client.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiResponse({ status: 201, description: 'Team member added' })
  create(@Body() dto: CreateTeamMemberDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Update team member (status, role, event)', description: 'OSC can update their own status; eventmanager/client can change any field.' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiParam({ name: 'id', description: 'Team member ID' })
  @ApiResponse({ status: 200, description: 'Team member updated' })
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.EVENTMANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove team member from event' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Team member ID' })
  @ApiResponse({ status: 200, description: 'Team member removed' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
