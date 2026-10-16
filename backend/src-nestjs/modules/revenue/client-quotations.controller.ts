import {
  Controller,
  Get,
  Post,
  Param,
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
} from '@nestjs/swagger';
import { QuotationsService } from './quotations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AcceptQuotationDto } from './dto/accept-quotation.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { PayQuotationDto } from './dto/pay-quotation.dto';

@ApiTags('Client Quotations')
@Controller('client/quotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (Requires CLIENT)' })
export class ClientQuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Get('request/:eventRequestId')
  @ApiOperation({ summary: 'Get Client Quotation', description: 'Retrieve sent quotation for an event request owned by client' })
  @ApiParam({ name: 'eventRequestId', description: 'Event Request ID' })
  @ApiResponse({ status: 200, description: 'Quotation details returned' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not own event request' })
  async getClientQuotation(
    @Param('eventRequestId') eventRequestId: string,
    @Req() req: any,
  ) {
    return this.service.getClientQuotation(eventRequestId, req.user.id);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept Quotation', description: 'Accept commercial quotation and transition event request to COMMERCIAL_APPROVED' })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({ status: 200, description: 'Quotation accepted, event preparation ready' })
  async acceptQuotation(
    @Param('id') id: string,
    @Body() dto: AcceptQuotationDto,
    @Req() req: any,
  ) {
    return this.service.acceptQuotation(id, req.user.id, dto);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay Quotation Milestone', description: 'Process payment for accepted quotation milestone according to payment schedule' })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({ status: 200, description: 'Payment recorded and confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Quotation not accepted or already fully paid' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not own quotation' })
  async payQuotation(
    @Param('id') id: string,
    @Body() dto: PayQuotationDto,
    @Req() req: any,
  ) {
    return this.service.processQuotationPayment(id, req.user.id, dto);
  }

  @Post(':id/request-changes')
  @ApiOperation({ summary: 'Request Quotation Changes', description: 'Request commercial terms revision from revenue team' })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({ status: 200, description: 'Change request logged' })
  async requestChanges(
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
    @Req() req: any,
  ) {
    return this.service.requestChanges(id, req.user.id, dto);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject Quotation', description: 'Decline commercial quotation proposal' })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({ status: 200, description: 'Quotation rejected' })
  async rejectQuotation(@Param('id') id: string, @Req() req: any) {
    return this.service.rejectQuotation(id, req.user.id);
  }
}
