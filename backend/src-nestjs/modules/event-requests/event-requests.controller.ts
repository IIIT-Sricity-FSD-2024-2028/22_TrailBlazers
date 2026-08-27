import {
  Controller,
  Post,
  Get,
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
}
