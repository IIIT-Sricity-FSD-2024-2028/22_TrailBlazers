import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignIssueDto {
  @ApiPropertyOptional({ description: 'Assigned staff user ID', example: 'usr_tech_200' })
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}
