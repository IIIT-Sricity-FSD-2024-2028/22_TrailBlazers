import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InteractNotificationDto {
  @ApiPropertyOptional({ description: 'Interaction action (VIEW / DISMISS / EXPIRE)', example: 'VIEW', enum: ['VIEW', 'DISMISS', 'EXPIRE'] })
  @IsOptional()
  @IsString()
  @IsIn(['VIEW', 'DISMISS', 'EXPIRE'], {
    message: 'Action must be VIEW, DISMISS, or EXPIRE.',
  })
  action?: 'VIEW' | 'DISMISS' | 'EXPIRE';
}
