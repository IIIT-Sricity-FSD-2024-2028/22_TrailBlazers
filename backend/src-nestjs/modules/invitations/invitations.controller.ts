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
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Invitations')
@Controller('invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role for role-based evaluation' })
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Private Invitation', description: 'Generate a secure invitation token for an attendee' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  async createInvitation(@Body() dto: CreateInvitationDto, @Req() req: any) {
    return this.service.createInvitation(dto, req.user);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Invitation Code', description: 'Check validity of private invitation token for attendee registration' })
  @ApiResponse({ status: 200, description: 'Invitation token is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation token' })
  @ApiResponse({ status: 403, description: 'Recipient email mismatch' })
  async validateInvitation(
    @Body() dto: ValidateInvitationDto,
    @Req() req: any,
  ) {
    return this.service.validateInvitation(dto, req.user);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get Event Invitations', description: 'List all invitations issued for an event' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Invitations list returned' })
  async getEventInvitations(
    @Param('eventId') eventId: string,
    @Req() req: any,
  ) {
    return this.service.getEventInvitations(eventId, req.user);
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke Invitation', description: 'Cancel an active invitation token' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(@Param('id') id: string, @Req() req: any) {
    return this.service.revokeInvitation(id, req.user);
  }
}
