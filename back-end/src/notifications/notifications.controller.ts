import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, UpdateNotificationDto } from './dto/notification.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Notifications')
@ApiSecurity('role-header')
@UseGuards(RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event' })
  @ApiQuery({ name: 'isRead', required: false, description: 'Filter by read status (true/false)' })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  findAll(@Query('eventId') eventId?: string, @Query('isRead') isRead?: string) {
    return this.service.findAll(eventId, isRead);
  }

  @Get('unread-count')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiResponse({ status: 200, description: 'Unread count' })
  getUnreadCount() {
    return this.service.getUnreadCount();
  }

  @Get(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.OSC, Role.EVENTMANAGER, Role.CLIENT)
  @ApiOperation({ summary: 'Create notification / report issue', description: 'OSC staff or client reports an issue; creates a notification for eventmanager.' })
  @ApiHeader({ name: 'role', description: 'superuser | osc | eventmanager | client', required: true })
  @ApiResponse({ status: 201, description: 'Notification created' })
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Update notification (mark read / resolve)' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/resolve')
  @Roles(Role.EVENTMANAGER, Role.CLIENT, Role.OSC)
  @ApiOperation({ summary: 'Resolve a notification' })
  @ApiHeader({ name: 'role', description: 'superuser | eventmanager | client | osc', required: true })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification resolved' })
  resolve(@Param('id') id: string) {
    return this.service.resolve(id);
  }

  @Delete(':id')
  @Roles(Role.EVENTMANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiHeader({ name: 'role', description: 'Must be: superuser | eventmanager', required: true, example: 'eventmanager' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
