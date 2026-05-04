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
    enum: ['pending', 'upcoming', 'live', 'completed', 'rejected'],
    description: 'Event status',
  })
  @IsIn(['pending', 'upcoming', 'live', 'completed', 'rejected'])
  status: string;

  @ApiProperty({ example: '2026-04-15', description: 'Event date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'India Habitat Centre, New Delhi', description: 'Event location' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ example: 'Convention Hall A', description: 'Venue name (alias for location)' })
  @IsOptional()
  @IsString()
  venue?: string;

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

  @ApiPropertyOptional({ example: 'u1', description: 'ID of the event manager (assigned on approval)' })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: 'Kavya Iyer', description: 'Name of the event manager' })
  @IsOptional()
  @IsString()
  managerName?: string;

  @ApiPropertyOptional({ example: 'u2', description: 'ID of the client who owns this event' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ example: 'priya.s@gmail.com', description: 'Email of the client who owns this event' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ example: 'Priya Sharma', description: 'Name of the client' })
  @IsOptional()
  @IsString()
  clientName?: string;

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

  @ApiPropertyOptional({ example: 'live', enum: ['pending', 'upcoming', 'live', 'completed', 'rejected'] })
  @IsOptional()
  @IsIn(['pending', 'upcoming', 'live', 'completed', 'rejected'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Taj Hotel, Mumbai' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Convention Hall A' })
  @IsOptional()
  @IsString()
  venue?: string;

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

  @ApiPropertyOptional({ example: 'u5' })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: 'Kavya Iyer' })
  @IsOptional()
  @IsString()
  managerName?: string;

  @ApiPropertyOptional({ example: 'u2' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ example: 'priya.s@gmail.com' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @IsOptional()
  @IsString()
  clientName?: string;

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
