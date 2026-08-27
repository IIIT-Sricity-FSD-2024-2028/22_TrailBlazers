import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiPropertyOptional({ description: 'Ticket number code', example: 'TKT-100-001' })
  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @ApiPropertyOptional({ description: 'Ticket unique ID', example: 'tkt_100' })
  @IsOptional()
  @IsString()
  ticketId?: string;
}
