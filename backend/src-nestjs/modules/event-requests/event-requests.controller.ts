import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EventRequestsService } from './event-requests.service';
import { CreateEventRequestDto } from './dto/create-event-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Event Requests')
@Controller('event-requests')
export class EventRequestsController {
  constructor(private readonly service: EventRequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires CLIENT)' })
  @ApiOperation({ summary: 'Submit Event Request', description: 'Create a new event proposal request for commercial pricing' })
  @ApiResponse({ status: 201, description: 'Event request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async createRequest(@Body() dto: CreateEventRequestDto, @Req() req: any) {
    return this.service.createEventRequest(dto, req.user.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires CLIENT)' })
  @ApiOperation({ summary: 'Get My Event Requests', description: 'Retrieve all event requests submitted by current client user' })
  @ApiResponse({ status: 200, description: 'Event requests list returned' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getMyRequests(@Req() req: any) {
    return this.service.getMyEventRequests(req.user.id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Event Statistics for Client', description: 'Retrieve tickets sold and attendee check-ins for client owned event' })
  @ApiResponse({ status: 200, description: 'Event statistics returned' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not authorized to view statistics for this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventStats(@Param('id') id: string, @Req() req: any) {
    return this.service.getEventStats(id, req.user);
  }

  @Get(':id/report-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Event Analytics Report Status',
    description: 'Check if event is completed and if Event Manager report exists',
  })
  @ApiResponse({ status: 200, description: 'Event report completion status returned' })
  async getReportStatus(@Param('id') id: string, @Req() req: any) {
    return this.service.getEventReportStatus(id, req.user);
  }

  @Get(':id/export-analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export Event Analytics Report',
    description: 'Download client-authorized event analytics report in PDF format',
  })
  @ApiResponse({ status: 200, description: 'PDF analytics report binary file download' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not authorized to export analytics for this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async exportEventAnalytics(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { buffer, filename, contentType } = await this.service.exportEventAnalytics(id, req.user);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  }
}
