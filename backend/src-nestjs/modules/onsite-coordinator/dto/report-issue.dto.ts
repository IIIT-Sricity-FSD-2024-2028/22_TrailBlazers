import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportIssueDto {
  @ApiPropertyOptional({ description: 'Issue category (AV_EQUIPMENT, LOGISTICS, SAFETY)', example: 'AV_EQUIPMENT' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Priority level (LOW, MEDIUM, HIGH, CRITICAL)', example: 'HIGH' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({ description: 'Detailed issue description', example: 'Stage microphone audio feedback' })
  @IsString()
  @IsNotEmpty({ message: 'Issue description is required.' })
  description: string;
}
