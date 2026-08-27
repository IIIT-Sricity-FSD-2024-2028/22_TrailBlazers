import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { NotificationsService } from './notifications.service';
import { InteractNotificationDto } from './dto/interact-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get User Notifications', description: 'Retrieve notifications inbox for authenticated user' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max number of notifications to return' })
  @ApiResponse({ status: 200, description: 'Notifications list returned' })
  async getUserNotifications(@Query('limit') limit: any, @Req() req: any) {
    return this.notificationsService.getUserNotifications(req.user.id, limit);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get Pending Popup Alerts', description: 'Retrieve pending modal/popup notifications needing user acknowledgement' })
  @ApiResponse({ status: 200, description: 'Pending popup alerts list returned' })
  async getPendingPopups(@Req() req: any) {
    return this.notificationsService.getPendingPopups(req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get Unread Count', description: 'Get unread notification count badge number' })
  @ApiResponse({ status: 200, description: 'Unread count returned' })
  async getUnreadCount(@Req() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Post('auto-expire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto Expire Alerts', description: 'Auto-expire unacknowledged pending popup notifications' })
  @ApiResponse({ status: 200, description: 'Pending alerts expired' })
  async autoExpirePending(@Req() req: any) {
    return this.notificationsService.autoExpirePending(req.user.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark All Read', description: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllNotificationsAsRead(req.user.id);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear Inbox (Clear Alias)', description: 'Delete all notifications from user inbox' })
  @ApiResponse({ status: 200, description: 'Inbox cleared' })
  async clearAllNotificationsClearAlias(@Req() req: any) {
    return this.notificationsService.clearAllNotifications(req.user.id);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Clear Inbox (All Alias)', description: 'Delete all notifications from user inbox' })
  @ApiResponse({ status: 200, description: 'Inbox cleared' })
  async clearAllNotificationsAllAlias(@Req() req: any) {
    return this.notificationsService.clearAllNotifications(req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear Inbox (Root Alias)', description: 'Delete all notifications from user inbox' })
  @ApiResponse({ status: 200, description: 'Inbox cleared' })
  async clearAllNotificationsRootAlias(@Req() req: any) {
    return this.notificationsService.clearAllNotifications(req.user.id);
  }

  @Post(':id/interact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Interact Notification', description: 'Acknowledge, view, or dismiss a popup notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification action recorded' })
  async interactNotification(
    @Param('id') id: string,
    @Body() dto: InteractNotificationDto,
    @Req() req: any,
  ) {
    return this.notificationsService.interactNotification(
      req.user.id,
      id,
      dto,
    );
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark Notification Read (POST)', description: 'Mark notification as read by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked read' })
  async markAsReadPost(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markNotificationAsRead(req.user.id, id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark Notification Read (PATCH)', description: 'Mark notification as read by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked read' })
  async markAsReadPatch(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markNotificationAsRead(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Single Notification', description: 'Delete notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@Param('id') id: string, @Req() req: any) {
    if (id === 'clear' || id === 'all') {
      return this.notificationsService.clearAllNotifications(req.user.id);
    }
    return this.notificationsService.deleteNotification(req.user.id, id);
  }
}
