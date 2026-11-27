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
import { RefundsService } from './refunds.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CancelEventDto } from './dto/cancel-event.dto';
import { PostponeEventDto } from './dto/postpone-event.dto';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { RecordDeductionDto } from './dto/record-deduction.dto';
import { ApproveRefundDto } from './dto/approve-refund.dto';
import { RejectRefundDto } from './dto/reject-refund.dto';
import { CompleteRefundDto } from './dto/complete-refund.dto';
import { RefundQueryDto } from './dto/refund-query.dto';

@ApiTags('Refund Management')
@Controller('refunds')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get('metrics')
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get Refund Metrics & KPIs', description: 'Retrieve total refunds, pending, approved, processing, refunded, and financial metrics' })
  @ApiResponse({ status: 200, description: 'Refund metrics returned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Access restricted to Revenue Department and Super Admin' })
  async getMetrics(@Req() req: any) {
    return this.refundsService.getMetrics(req.user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get Current User Refunds', description: 'Retrieve all refund records submitted by or issued to the authenticated attendee or client' })
  @ApiResponse({ status: 200, description: 'List of user refund records returned' })
  async getMyRefunds(@Req() req: any) {
    return this.refundsService.getMyRefunds(req.user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get Filtered Refunds List', description: 'Retrieve all refund requests with customer type, status, event, and date filters' })
  @ApiQuery({ name: 'customerType', required: false, description: 'Filter by ATTENDEE or CLIENT' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by refund status' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search customer name, email, event, or refund ID' })
  @ApiResponse({ status: 200, description: 'List of refunds returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRefunds(@Query() query: RefundQueryDto, @Req() req: any) {
    return this.refundsService.getRefunds(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Refund Details & Breakdown', description: 'Retrieve detailed refund specification, original payments, deductions, and audit trail' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund details returned' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not authorized to view this refund' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async getRefundDetails(@Param('id') id: string, @Req() req: any) {
    return this.refundsService.getRefundDetails(id, req.user);
  }

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request Refund', description: 'Attendee or Client requests a refund for an eligible ticket or cancelled event' })
  @ApiResponse({ status: 201, description: 'Refund request created or transitioned to REQUESTED' })
  @ApiResponse({ status: 400, description: 'Invalid ticket or refund already requested' })
  async requestRefund(@Body() dto: CreateRefundRequestDto, @Req() req: any) {
    return this.refundsService.requestRefund(dto, req.user);
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER')
  @ApiOperation({ summary: 'Review Refund Request', description: 'Revenue team member marks refund as UNDER_REVIEW' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund status set to UNDER_REVIEW' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only Revenue Team can review refunds' })
  async reviewRefund(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Req() req: any,
  ) {
    return this.refundsService.reviewRefund(id, notes, req.user);
  }

  @Post(':id/deductions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER')
  @ApiOperation({ summary: 'Record Deductions', description: 'Revenue team records verified expenses or contractual deductions' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Deductions recorded and refundable amount recalculated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async recordDeductions(
    @Param('id') id: string,
    @Body() dto: RecordDeductionDto,
    @Req() req: any,
  ) {
    return this.refundsService.recordDeductions(id, dto, req.user);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER')
  @ApiOperation({ summary: 'Approve Refund', description: 'Revenue team member approves refund amount' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund approved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async approveRefund(
    @Param('id') id: string,
    @Body() dto: ApproveRefundDto,
    @Req() req: any,
  ) {
    return this.refundsService.approveRefund(id, dto, req.user);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER')
  @ApiOperation({ summary: 'Reject Refund Request', description: 'Revenue team member rejects refund with mandatory reason' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund rejected' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async rejectRefund(
    @Param('id') id: string,
    @Body() dto: RejectRefundDto,
    @Req() req: any,
  ) {
    return this.refundsService.rejectRefund(id, dto, req.user);
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER')
  @ApiOperation({ summary: 'Mark Refund as PROCESSING', description: 'Transition approved refund to PROCESSING' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund status set to PROCESSING' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async processRefund(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Req() req: any,
  ) {
    return this.refundsService.processRefund(id, notes, req.user);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER')
  @ApiOperation({ summary: 'Complete Refund Settlement', description: 'Mark refund as REFUNDED and record transaction settlement reference ID' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund finalized and recorded as REFUNDED' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async completeRefund(
    @Param('id') id: string,
    @Body() dto: CompleteRefundDto,
    @Req() req: any,
  ) {
    return this.refundsService.completeRefund(id, dto, req.user);
  }

  @Post(':id/fail')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('REVENUE', 'DEPARTMENT_MANAGER')
  @ApiOperation({ summary: 'Mark Refund as FAILED', description: 'Mark refund settlement as failed with failure reason' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Refund marked as FAILED' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async failRefund(
    @Param('id') id: string,
    @Body('failureReason') failureReason: string,
    @Req() req: any,
  ) {
    return this.refundsService.failRefund(id, failureReason, req.user);
  }

  @Get('cancellation-preview/:eventId')
  @ApiOperation({ summary: 'Get Client Event Cancellation Preview & Refund Calculation', description: 'Computes active tier, deduction, and refundable amount per the official cancellation policy' })
  @ApiParam({ name: 'eventId', description: 'Event ID or Event Request ID' })
  @ApiResponse({ status: 200, description: 'Cancellation preview calculation returned' })
  async getCancellationPreview(
    @Param('eventId') eventId: string,
    @Req() req: any,
  ) {
    return this.refundsService.getCancellationPreview(eventId, req.user);
  }

  @Post('cancel-event/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel Event and Trigger Refund Workflow', description: 'Initiate event cancellation, notify attendees & client, and create refund records' })
  @ApiParam({ name: 'eventId', description: 'Event ID or Event Request ID' })
  @ApiResponse({ status: 200, description: 'Event cancelled and refund eligibility records generated' })
  @ApiResponse({ status: 400, description: 'Cancellation reason is required' })
  @ApiResponse({ status: 403, description: 'Forbidden. User is not authorized to cancel this event' })
  async cancelEvent(
    @Param('eventId') eventId: string,
    @Body() dto: CancelEventDto,
    @Req() req: any,
  ) {
    return this.refundsService.cancelEvent(eventId, dto, req.user);
  }

  @Post('postpone-event/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Postpone Event', description: 'Reschedule event date without cancellation; enables ticket retention or 100% refund choice' })
  @ApiParam({ name: 'eventId', description: 'Event ID or Event Request ID' })
  @ApiResponse({ status: 200, description: 'Event postponed and attendees notified' })
  async postponeEvent(
    @Param('eventId') eventId: string,
    @Body() dto: PostponeEventDto,
    @Req() req: any,
  ) {
    return this.refundsService.postponeEvent(eventId, dto, req.user);
  }

  @Post(':id/retain-ticket')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retain Ticket for Postponed Event', description: 'Attendee elects to retain ticket for rescheduled event date instead of taking a refund' })
  @ApiParam({ name: 'id', description: 'Refund ID' })
  @ApiResponse({ status: 200, description: 'Ticket retained for new date' })
  async retainTicket(@Param('id') id: string, @Req() req: any) {
    return this.refundsService.retainTicket(id, req.user);
  }
}

