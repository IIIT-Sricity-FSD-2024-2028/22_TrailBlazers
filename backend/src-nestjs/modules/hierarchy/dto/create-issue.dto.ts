import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIssueDto {
  @ApiPropertyOptional({ description: 'Issue category', example: 'AV_EQUIPMENT' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Issue priority level', example: 'High', enum: ['Low', 'Medium', 'High', 'Critical'] })
  @IsOptional()
  @IsString()
  @IsIn(['Low', 'Medium', 'High', 'Critical'], {
    message: "Priority must be 'Low', 'Medium', 'High', or 'Critical'.",
  })
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';

  @ApiProperty({ description: 'Detailed issue description', example: 'Main projector bulb failure in Hall A' })
  @IsString()
  @IsNotEmpty({ message: 'Issue description is required.' })
  description: string;

  @ApiPropertyOptional({ description: 'Type of issue', example: 'OPERATIONAL', enum: ['OPERATIONAL', 'TECHNICAL'] })
  @IsOptional()
  @IsString()
  @IsIn(['OPERATIONAL', 'TECHNICAL'], {
    message: "issueType must be 'OPERATIONAL' or 'TECHNICAL'.",
  })
  issueType?: 'OPERATIONAL' | 'TECHNICAL';

  @ApiPropertyOptional({ description: 'Associated Event ID', example: 'evt_100' })
  @IsOptional()
  @IsString()
  eventId?: string;
}
