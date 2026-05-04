import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TimelineSessionDto {
  @ApiProperty({ example: '09:00 AM', description: 'Start time of the session' })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({ example: 'Keynote: Future of AI', description: 'Session title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Dr. Ananya Gupta', description: 'Speaker name' })
  @IsString()
  @IsNotEmpty()
  speaker: string;

  @ApiPropertyOptional({ example: 'Main Auditorium', description: 'Session location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '1 hour', description: 'Session duration' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional({ example: 'keynote', description: 'Session type (keynote, panel, workshop, talk, demo, break)' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class EventStatsDto {
  @ApiPropertyOptional({ example: 342 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rsvps?: number;

  @ApiPropertyOptional({ example: 298 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  checkins?: number;

  @ApiPropertyOptional({ example: 87.5 })
  @IsOptional()
  @IsNumber()
  engagement?: number;

  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ type: [Number], example: [10, 25, 45, 30, 55, 78] })
  @IsOptional()
  @IsArray()
  participationTrend?: number[];

  @ApiPropertyOptional({ example: 92 })
  @IsOptional()
  @IsNumber()
  feedbackScore?: number;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Global Tech Summit 2026', description: 'Event title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'upcoming',
    enum: ['pending', 'upcoming', 'live', 'completed'],
    description: 'Event status',
  })
  @IsIn(['pending', 'upcoming', 'live', 'completed'])
  status: string;

  @ApiProperty({ example: '2026-04-15', description: 'Event date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'India Habitat Centre, New Delhi', description: 'Event location' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 500, description: 'Maximum capacity of the event' })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 'Client Hosted Events', description: 'Event domain/category' })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({ example: 'Explore the future of technology with industry leaders.', description: 'Event description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'u1', description: 'ID of the event manager (superuser)' })
  @IsString()
  @IsNotEmpty()
  managerId: string;

  @ApiProperty({ example: 'Rajesh Kumar', description: 'Name of the event manager' })
  @IsString()
  @IsNotEmpty()
  managerName: string;

  @ApiPropertyOptional({ type: [TimelineSessionDto], description: 'Event sessions/timeline' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineSessionDto)
  timeline?: TimelineSessionDto[];

  @ApiPropertyOptional({ type: EventStatsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventStatsDto)
  stats?: EventStatsDto;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Updated Event Title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: 'live', enum: ['pending', 'upcoming', 'live', 'completed'] })
  @IsOptional()
  @IsIn(['pending', 'upcoming', 'live', 'completed'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Taj Hotel, Mumbai' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 'Tech Conferences' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'Updated description.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [TimelineSessionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineSessionDto)
  timeline?: TimelineSessionDto[];

  @ApiPropertyOptional({ type: EventStatsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventStatsDto)
  stats?: EventStatsDto;
}
