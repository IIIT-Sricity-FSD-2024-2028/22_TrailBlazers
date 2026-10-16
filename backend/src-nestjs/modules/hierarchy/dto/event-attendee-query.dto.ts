import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EventAttendeeQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for attendee name, email, or registration/ticket ID',
    example: 'Ananya',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by registration or payment status (e.g. ALL, ACTIVE, CONFIRMED, PENDING, CANCELLED)',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by ticket status (e.g. ALL, ACTIVE, CANCELLED)',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  ticketStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by attendance check-in status (e.g. ALL, CHECKED_IN, NOT_CHECKED_IN)',
    example: 'CHECKED_IN',
  })
  @IsOptional()
  @IsString()
  checkedIn?: string;
}
