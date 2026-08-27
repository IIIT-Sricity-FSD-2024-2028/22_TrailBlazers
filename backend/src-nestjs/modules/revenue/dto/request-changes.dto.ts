import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestChangesDto {
  @ApiPropertyOptional({ description: 'Details of change request', example: 'Request 10% volume discount' })
  @IsOptional()
  @IsString()
  requestedChanges?: string;
}
