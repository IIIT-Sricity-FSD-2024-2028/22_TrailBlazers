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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ChangeRequestsService } from './change-requests.service';
import { SubmitChangeRequestDto } from './dto/submit-change-request.dto';
import { ReviewChangeRequestDto } from './dto/review-change-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Change Requests')
@Controller('change-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (CLIENT / EVENT_MANAGER)' })
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit Change Request', description: 'Request event modifications (date, venue, capacity) after initial approval' })
  @ApiResponse({ status: 201, description: 'Change request submitted successfully' })
  async submitChangeRequest(
    @Body() dto: SubmitChangeRequestDto,
    @Req() req: any,
  ) {
    return this.changeRequestsService.submitChangeRequest(dto, req.user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get Client Change Requests', description: 'Retrieve change requests submitted by current client user' })
  @ApiResponse({ status: 200, description: 'Client change requests list returned' })
  async getClientChangeRequests(@Req() req: any) {
    return this.changeRequestsService.getClientChangeRequests(req.user.id);
  }

  @Get('manager')
  @ApiOperation({ summary: 'Get Manager Pending Change Requests', description: 'Retrieve pending change requests requiring Event Manager review' })
  @ApiResponse({ status: 200, description: 'Pending change requests list returned' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires EVENT_MANAGER role' })
  async getManagerPendingChangeRequests(@Req() req: any) {
    if (
      req.user.role !== 'EVENT_MANAGER' &&
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        'Access denied. Event Manager authorization required.',
      );
    }
    return this.changeRequestsService.getManagerPendingChangeRequests(
      req.user.id,
    );
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review Change Request', description: 'Approve, reject, or request quotation revision for a change request' })
  @ApiParam({ name: 'id', description: 'Change Request ID' })
  @ApiResponse({ status: 200, description: 'Change request review recorded' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires EVENT_MANAGER role' })
  async reviewChangeRequest(
    @Param('id') id: string,
    @Body() dto: ReviewChangeRequestDto,
    @Req() req: any,
  ) {
    if (
      req.user.role !== 'EVENT_MANAGER' &&
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        'Access denied. Event Manager authorization required.',
      );
    }
    return this.changeRequestsService.reviewChangeRequest(id, dto, req.user);
  }
}
