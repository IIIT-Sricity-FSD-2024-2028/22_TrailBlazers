import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { EventsService } from "./events.service";
import { EventQueryDto } from "./dto/event-query.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { HierarchyService } from "../hierarchy/hierarchy.service";
import { EventAttendeeQueryDto } from "../hierarchy/dto/event-attendee-query.dto";
import { RevenueService } from "../revenue/revenue.service";
import { Post, HttpCode, HttpStatus } from "@nestjs/common";

@ApiTags("Events")
@Controller("events")
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly hierarchyService: HierarchyService,
    private readonly revenueService: RevenueService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Browse Public Events",
    description:
      "Retrieve published public events with optional filtering by search, category, and price",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search term for event name or organization",
  })
  @ApiQuery({
    name: "category",
    required: false,
    description: "Filter by category (e.g. Conference, Seminar)",
  })
  @ApiQuery({
    name: "priceFilter",
    required: false,
    description: "Filter by ticket price (all, free, paid)",
  })
  @ApiResponse({
    status: 200,
    description: "List of published events returned",
  })
  async getEvents(@Query() query: EventQueryDto) {
    return this.service.getEvents(query);
  }

  @Get("/ev")
  getEvent() {
    return this.service.getAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get Event Details",
    description:
      "Retrieve event profile, sessions, venue details, and registration status by ID",
  })
  @ApiParam({ name: "id", description: "Event Unique ID" })
  @ApiResponse({ status: 200, description: "Event details object returned" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async getEventById(@Param("id") id: string) {
    return this.service.getEventById(id);
  }

  @Get(":id/attendees")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get Event-Wise Attendees for Super Admin",
    description:
      "Retrieve real-time attendee list and ticket registrations for a specific event",
  })
  @ApiParam({ name: "id", description: "Event Unique ID or Request ID" })
  @ApiResponse({
    status: 200,
    description: "Event attendees and registration summary returned",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Super Admin required" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async getEventAttendees(
    @Param("id") id: string,
    @Query() query: EventAttendeeQueryDto,
    @Req() req: any,
  ) {
    return this.hierarchyService.getEventAttendees(id, query, req.user);
  }

  @Post(":id/escalate")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("REVENUE", "DEPARTMENT_MANAGER", "SUPER_ADMIN")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Escalate Accepted Event to Event Management Department Head",
    description: "Revenue Team escalates an accepted commercial event to Event Management for operational assignment",
  })
  @ApiParam({ name: "id", description: "Event Request ID" })
  @ApiResponse({ status: 200, description: "Event escalated successfully" })
  @ApiResponse({ status: 400, description: "Quotation not accepted or already escalated" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async escalateEvent(@Param("id") id: string, @Req() req: any) {
    return this.revenueService.escalateToManagement(id, req.user);
  }
}
