import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIssueStatusDto {
  @ApiProperty({ description: 'New issue status (OPEN, IN_PROGRESS, RESOLVED)', example: 'RESOLVED' })
  @IsString()
  @IsNotEmpty({ message: 'Status is required.' })
  status: string;

  @ApiPropertyOptional({ description: 'Resolution explanation or fix details', example: 'Replaced audio transmitter' })
  @IsOptional()
  @IsString()
  resolutionDetails?: string;
}
