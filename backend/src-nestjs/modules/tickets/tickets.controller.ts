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
import { TicketsService } from './tickets.service';
import { RegisterTicketDto } from './dto/register-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Tickets & Payments')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({ name: 'x-role', required: false, description: 'User role (ATTENDEE, CLIENT, etc.)' })
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register Ticket & Process Payment', description: 'Atomically creates ticket, creates payment, decrements event availableTickets, and consumes invitation' })
  @ApiResponse({ status: 201, description: 'Ticket registered and payment confirmed' })
  @ApiResponse({ status: 400, description: 'Overselling error or invalid ticket quantity' })
  @ApiResponse({ status: 403, description: 'Email unverified or invalid invitation code' })
  async registerTicket(@Body() dto: RegisterTicketDto, @Req() req: any) {
    return this.service.registerTicket(dto, req.user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get My Tickets', description: 'Retrieve all registered event tickets belonging to authenticated attendee user' })
  @ApiResponse({ status: 200, description: 'User tickets list returned' })
  async getMyTickets(@Req() req: any) {
    return this.service.getMyTickets(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Ticket Details', description: 'Retrieve ticket profile and QR check-in status by ticket ID' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket details returned' })
  @ApiResponse({ status: 404, description: 'Ticket not found or access blocked for non-owner' })
  async getTicketById(@Param('id') id: string, @Req() req: any) {
    return this.service.getTicketById(id, req.user.id);
  }
}
