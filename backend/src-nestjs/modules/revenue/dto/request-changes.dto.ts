import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestChangesDto {
  @ApiPropertyOptional({ description: 'Details of change request / negotiation', example: 'Request milestone payment adjustment' })
  @IsOptional()
  @IsString()
  requestedChanges?: string;

  @ApiPropertyOptional({ description: 'Specific change type category', example: 'Payment Schedule Negotiation' })
  @IsOptional()
  @IsString()
  changeType?: string;

  @ApiPropertyOptional({ description: 'Reason for requesting changes', example: 'Client budget milestone alignment' })
  @IsOptional()
  @IsString()
  reason?: string;
}
