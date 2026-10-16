import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventRequestDto {
  @ApiProperty({ description: 'Organization or client company name', example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required.' })
  organizationName: string;

  @ApiProperty({ description: 'Contact email address', example: 'contact@acme.com' })
  @IsEmail({}, { message: 'Please enter a valid contact email.' })
  @IsNotEmpty({ message: 'Contact email is required.' })
  contactEmail: string;

  @ApiProperty({ description: 'Title or name of the proposed event', example: 'Annual Tech Conference 2026' })
  @IsString()
  @IsNotEmpty({ message: 'Event name is required.' })
  eventName: string;

  @ApiPropertyOptional({ description: 'Overview and description of the event', example: 'Annual flagship event covering Cloud & AI' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Detailed event agenda', example: '09:00 Keynote, 11:00 Breakout sessions' })
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiProperty({ description: 'Category of event', example: 'Conference' })
  @IsString()
  @IsNotEmpty({ message: 'Category is required.' })
  category: string;

  @ApiPropertyOptional({ description: 'Event date (legacy YYYY-MM-DD)', example: '2026-10-15' })
  @IsOptional()
  @IsString()
  eventDate?: string;

  @ApiPropertyOptional({ description: 'Event start date (YYYY-MM-DD)', example: '2026-10-15' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Event end date (YYYY-MM-DD)', example: '2026-10-18' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)', example: '09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)', example: '17:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ description: 'Primary venue hall or building', example: 'Grand Ballroom Hall A' })
  @IsString()
  @IsNotEmpty({ message: 'Venue is required.' })
  venue: string;

  @ApiProperty({ description: 'City / Location', example: 'San Francisco, CA' })
  @IsString()
  @IsNotEmpty({ message: 'Location is required.' })
  location: string;

  @ApiPropertyOptional({ description: 'Event format type (In-Person / Virtual / Hybrid)', example: 'In-Person' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ description: 'Expected total attendee count', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Expected attendance must be a valid number.' })
  expectedAttendance?: number;

  @ApiPropertyOptional({ description: 'Whether tickets are paid or free', example: true })
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Commercial price per ticket', example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Ticket price must be a valid number.' })
  ticketPrice?: number;

  @ApiPropertyOptional({ description: 'Frequency (One-Time / Recurring)', example: 'One-Time' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Recurring occurrences per week if applicable', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Recurring per week must be a valid number.' })
  recurringPerWeek?: number;

  @ApiPropertyOptional({ description: 'Special requirements or additional comments', example: 'AV & catering needed' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @ApiPropertyOptional({ description: 'Event banner image URL', example: '/uploads/banner-123.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}
