import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'Session title or topic', example: 'Keynote: Future of Cloud Architecture' })
  @IsString()
  @IsNotEmpty({ message: 'Session title is required.' })
  title: string;

  @ApiPropertyOptional({ description: 'Hall or room designation', example: 'Auditorium A' })
  @IsOptional()
  @IsString()
  hall?: string;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)', example: '10:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)', example: '11:30' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
