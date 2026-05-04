import { IsString, IsNotEmpty, IsEmail, IsIn, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePendingRequestDto {
  @ApiProperty({ example: 'Tech Innovation Summit 2026', description: 'Proposed event name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Pune, Maharashtra', description: 'Proposed event location' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 500, description: 'Expected number of attendees' })
  @IsNumber()
  @Min(1)
  expected: number;

  @ApiProperty({ example: 'Priya Sharma', description: 'Client / requester name' })
  @IsString()
  @IsNotEmpty()
  client: string;

  @ApiProperty({ example: 'priya.s@techcorp.com', description: 'Client email' })
  @IsEmail()
  clientEmail: string;

  @ApiProperty({ example: '2026-05-15', description: 'Desired event date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Annual technology conference featuring AI and blockchain workshops', description: 'Event description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'In-Person', enum: ['In-Person', 'Virtual', 'Hybrid'], description: 'Event type' })
  @IsIn(['In-Person', 'Virtual', 'Hybrid'])
  type: string;
}

export class ReviewPendingRequestDto {
  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected'], description: 'Approval decision' })
  @IsIn(['approved', 'rejected'])
  decision: string;

  @ApiPropertyOptional({ example: 'u1', description: 'Manager ID to assign (required when approving)' })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiPropertyOptional({ example: 'Rajesh Kumar', description: 'Manager name' })
  @IsOptional()
  @IsString()
  managerName?: string;

  @ApiPropertyOptional({ example: 'Budget constraints', description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
