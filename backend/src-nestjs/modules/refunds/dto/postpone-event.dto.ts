import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostponeEventDto {
  @ApiProperty({ description: 'New scheduled date for the event (YYYY-MM-DD)', example: '2026-12-15' })
  @IsString()
  @IsNotEmpty()
  newDate: string;

  @ApiProperty({ description: 'Reason for postponing the event', example: 'Keynote speaker rescheduled due to travel delays' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'New start time', example: '10:00 AM' })
  @IsOptional()
  @IsString()
  newStartTime?: string;

  @ApiPropertyOptional({ description: 'New end time', example: '06:00 PM' })
  @IsOptional()
  @IsString()
  newEndTime?: string;
}

