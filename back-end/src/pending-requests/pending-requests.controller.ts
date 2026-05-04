import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { PendingRequestsService } from './pending-requests.service';
import { CreatePendingRequestDto, ReviewPendingRequestDto } from './dto/pending-request.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Pending Requests')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('pending-requests')
export class PendingRequestsController {
  constructor(private readonly service: PendingRequestsService) {}

  @Get()
  @Roles(Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Get all event requests', description: 'Eventmanager views all client event hosting requests.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiQuery({ name: 'status', required: false, enum: ['Pending', 'Approved', 'Rejected'] })
  @ApiResponse({ status: 200, description: 'List of pending requests' })
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Get request by ID' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager | client', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Request ID (e.g. pr1)' })
  @ApiResponse({ status: 200, description: 'Request details' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.CLIENT, Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Submit new event hosting request', description: 'Client submits a request to host an event.' })
  @ApiHeader({ name: 'role', description: 'superuser | client | eventmanager', required: true })
  @ApiResponse({ status: 201, description: 'Request submitted' })
  create(@Body() dto: CreatePendingRequestDto) {
    return this.service.create(dto);
  }

  @Patch(':id/review')
  @Roles(Role.EVENTMANAGER)
  @ApiOperation({ summary: 'Approve or reject an event request', description: 'Eventmanager reviews a pending request. Approval requires managerId.' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request reviewed' })
  @ApiResponse({ status: 400, description: 'Already reviewed or missing managerId' })
  review(@Param('id') id: string, @Body() dto: ReviewPendingRequestDto) {
    return this.service.review(id, dto);
  }

  @Delete(':id')
  @Roles(Role.EVENTMANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete event request' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
