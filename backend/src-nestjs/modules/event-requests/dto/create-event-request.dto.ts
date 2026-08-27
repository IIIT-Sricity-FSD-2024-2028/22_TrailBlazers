import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
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

  @ApiProperty({ description: 'Event date (YYYY-MM-DD)', example: '2026-10-15' })
  @IsString()
  @IsNotEmpty({ message: 'Event date is required.' })
  eventDate: string;

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
  @IsNumber()
  expectedAttendance?: number;

  @ApiPropertyOptional({ description: 'Whether tickets are paid or free', example: true })
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Commercial price per ticket', example: 150 })
  @IsOptional()
  @IsNumber()
  ticketPrice?: number;

  @ApiPropertyOptional({ description: 'Frequency (One-Time / Recurring)', example: 'One-Time' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Recurring occurrences per week if applicable', example: 1 })
  @IsOptional()
  @IsNumber()
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
