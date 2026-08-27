import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveIssueDto {
  @ApiPropertyOptional({ description: 'Resolution explanation or fix summary', example: 'Replaced failed HDMI switcher' })
  @IsOptional()
  @IsString()
  resolutionDetails?: string;
}
