import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRefundRequestDto {
  @ApiPropertyOptional({ description: 'Attendee ticket ID if requesting ticket refund' })
  @IsOptional()
  @IsString()
  ticketId?: string;

  @ApiPropertyOptional({ description: 'Quotation ID if requesting client contract refund' })
  @IsOptional()
  @IsString()
  quotationId?: string;

  @ApiPropertyOptional({ description: 'Event ID or Event Request ID' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Customer reason for requesting refund' })
  @IsOptional()
  @IsString()
  reason?: string;
}

