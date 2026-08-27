import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { EventQueryDto } from './dto/event-query.dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Browse Public Events', description: 'Retrieve published public events with optional filtering by search, category, and price' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for event name or organization' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (e.g. Conference, Seminar)' })
  @ApiQuery({ name: 'priceFilter', required: false, description: 'Filter by ticket price (all, free, paid)' })
  @ApiResponse({ status: 200, description: 'List of published events returned' })
  async getEvents(@Query() query: EventQueryDto) {
    return this.service.getEvents(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Event Details', description: 'Retrieve event profile, sessions, venue details, and registration status by ID' })
  @ApiParam({ name: 'id', description: 'Event Unique ID' })
  @ApiResponse({ status: 200, description: 'Event details object returned' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(@Param('id') id: string) {
    return this.service.getEventById(id);
  }
}
