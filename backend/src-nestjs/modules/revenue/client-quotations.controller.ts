import {
  Controller,
  Get,
  Post,
  Param,
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
  async acceptQuotation(@Param('id') id: string, @Req() req: any) {
    return this.service.acceptQuotation(id, req.user.id);
  }

  @Post(':id/request-changes')
  @ApiOperation({ summary: 'Request Quotation Changes', description: 'Request commercial terms revision from revenue team' })
  @ApiParam({ name: 'id', description: 'Quotation ID' })
  @ApiResponse({ status: 200, description: 'Change request logged' })
  async requestChanges() {
    return this.service.requestChanges();
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
