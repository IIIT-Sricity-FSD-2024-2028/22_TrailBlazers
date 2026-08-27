import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EscalateIssueDto {
  @ApiPropertyOptional({ description: 'Escalation reason', example: 'Unresolved technical blocker requiring IT Support leadership intervention' })
  @IsOptional()
  @IsString()
  reason?: string;
}
