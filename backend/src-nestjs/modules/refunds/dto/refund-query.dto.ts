import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundQueryDto {
  @ApiPropertyOptional({ description: 'Filter by customer type (ATTENDEE or CLIENT)' })
  @IsOptional()
  @IsString()
  customerType?: string;

  @ApiPropertyOptional({ description: 'Filter by refund status (ELIGIBLE, REQUESTED, UNDER_REVIEW, APPROVED, REJECTED, PROCESSING, REFUNDED, FAILED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by Event ID or Event Request ID' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Search term for refund ID, customer name, email, event, or transaction reference' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

