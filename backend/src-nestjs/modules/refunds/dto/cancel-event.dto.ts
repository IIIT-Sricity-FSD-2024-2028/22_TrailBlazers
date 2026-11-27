import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelEventDto {
  @ApiProperty({ description: 'Detailed reason for event cancellation', example: 'Severe weather advisory and venue unavailability' })
  @IsString()
  @IsNotEmpty()
  cancellationReason: string;

  @ApiPropertyOptional({ description: 'Whether operational work has started for the event', example: false })
  @IsOptional()
  @IsBoolean()
  workStarted?: boolean;

  @ApiPropertyOptional({ description: 'Additional administrative or client notes', example: 'Client notified via telephone conference' })
  @IsOptional()
  @IsString()
  notes?: string;
}

