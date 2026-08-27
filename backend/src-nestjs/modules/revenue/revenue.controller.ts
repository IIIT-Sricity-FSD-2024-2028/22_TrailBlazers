import {
  Controller,
  Get,
  Post,
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
import { RevenueService } from './revenue.service';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Revenue & Quotations')
@Controller('revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('REVENUE')
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires REVENUE)' })
export class RevenueController {
  constructor(
    private readonly revenueService: RevenueService,
    private readonly quotationsService: QuotationsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Revenue Dashboard Metrics', description: 'Retrieve pipeline metrics, revenue totals, and pending pricing requests' })
  @ApiResponse({ status: 200, description: 'Revenue metrics returned' })
  async getDashboard() {
    return this.revenueService.getDashboard();
  }

  @Get('event-requests')
  @ApiOperation({ summary: 'Get Pricing Event Requests', description: 'Retrieve filterable event requests submitted for commercial quotation' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by client or event name' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by quotation status' })
  @ApiResponse({ status: 200, description: 'Event requests list returned' })
  async getEventRequests(@Query() query: any) {
    return this.revenueService.getEventRequests(query);
  }

  @Get('event-requests/:id')
  @ApiOperation({ summary: 'Get Event Request Pricing Details', description: 'Retrieve full event request specification for quotation drafting' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Event request details returned' })
  async getEventRequestDetails(@Param('id') id: string) {
    return this.revenueService.getEventRequestDetails(id);
  }

  @Post('quotations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Commercial Quotation', description: 'Draft a commercial quotation with line items and terms' })
  @ApiResponse({ status: 201, description: 'Quotation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid line items or event request ID' })
  async createQuotation(@Body() dto: CreateQuotationDto, @Req() req: any) {
    return this.quotationsService.createQuotation(dto, req.user);
  }

  @Post('quotations/:id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send Quotation to Client', description: 'Finalize and dispatch quotation to the client user for approval' })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({ status: 200, description: 'Quotation dispatched to client' })
  async sendQuotation(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.sendQuotation(id, req.user);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get Revenue Analytics', description: 'Retrieve commercial performance analytics and revenue reports' })
  @ApiResponse({ status: 200, description: 'Revenue analytics object returned' })
  async getAnalytics() {
    return this.revenueService.getAnalytics();
  }

  @Get('clients')
  @ApiOperation({ summary: 'Get Revenue Client Portfolio', description: 'Retrieve corporate client list and commercial order histories' })
  @ApiResponse({ status: 200, description: 'Client portfolio list returned' })
  async getClients() {
    return this.revenueService.getClients();
  }

  @Get('event-managers')
  @ApiOperation({ summary: 'Get Event Managers Availability', description: 'Retrieve Event Managers with real-time assignment status and overlap validation' })
  @ApiQuery({ name: 'eventDate', required: false, description: 'Target event date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Event Managers list with availability returned' })
  async getEventManagers(@Query('eventDate') eventDate?: string) {
    return this.revenueService.getEventManagers(eventDate);
  }

  @Post('event-requests/:id/assign-manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign Event Manager to Event Request', description: 'Assign an available Event Manager with backend schedule overlap validation' })
  @ApiParam({ name: 'id', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Event Manager assigned successfully' })
  @ApiResponse({ status: 400, description: 'Manager unavailable or invalid role' })
  async assignManager(@Param('id') id: string, @Body() body: any) {
    const managerUserId = body.managerUserId || body.eventManagerUserId;
    const onsiteCoordinatorUserId = body.onsiteCoordinatorUserId;
    return this.revenueService.assignManager(id, managerUserId, onsiteCoordinatorUserId);
  }
}
