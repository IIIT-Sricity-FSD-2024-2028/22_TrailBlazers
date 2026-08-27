import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitChangeRequestDto {
  @ApiProperty({ description: 'Target Event Request ID', example: 'req_ab1234' })
  @IsString()
  @IsNotEmpty({ message: 'Event Request ID and requested change details are required.' })
  eventRequestId: string;

  @ApiPropertyOptional({ description: 'Type of change requested (VENUE, DATE, CAPACITY, AGENDA)', example: 'DATE' })
  @IsOptional()
  @IsString()
  changeType?: string;

  @ApiPropertyOptional({ description: 'Existing specification details', example: 'Event Date: 2026-10-15' })
  @IsOptional()
  @IsString()
  currentDetails?: string;

  @ApiProperty({ description: 'Requested new specification details', example: 'Postpone Event Date to 2026-11-20' })
  @IsString()
  @IsNotEmpty({ message: 'Event Request ID and requested change details are required.' })
  requestedChange: string;

  @ApiPropertyOptional({ description: 'Reason for modification request', example: 'Keynote speaker availability conflict' })
  @IsOptional()
  @IsString()
  reason?: string;
}
