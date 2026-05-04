import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Scanner Error', description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'QR scanner at Gate 2 is offline', description: 'Notification description' })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiProperty({ example: 'high', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level' })
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority: string;

  @ApiPropertyOptional({ example: 'Alex Thompson', description: 'Person reporting the issue' })
  @IsOptional()
  @IsString()
  reporter?: string;

  @ApiPropertyOptional({ example: 'e1', description: 'Associated event ID' })
  @IsOptional()
  @IsString()
  eventId?: string;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ example: true, description: 'Mark as read' })
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({ example: 'resolved', enum: ['open', 'resolved'] })
  @IsOptional()
  @IsIn(['open', 'resolved'])
  status?: string;
}
