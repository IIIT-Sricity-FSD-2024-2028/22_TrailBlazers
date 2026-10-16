import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignCoordinatorDto {
  @ApiPropertyOptional({ description: 'Single Onsite Coordinator User ID', example: 'usr_coord_karan' })
  @IsOptional()
  @IsString()
  coordinatorUserId?: string;

  @ApiPropertyOptional({ description: 'List of Onsite Coordinator User IDs', example: ['usr_coord_karan'] })
  @IsOptional()
  @IsArray()
  coordinatorUserIds?: string[];
}
