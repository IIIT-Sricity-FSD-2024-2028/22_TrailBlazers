import { IsNotEmpty, IsString, IsArray, ArrayMinSize, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionPollDto {
  @ApiProperty({ description: 'Event Unique ID', example: 'evt-1' })
  @IsNotEmpty({ message: 'Event ID is required' })
  @IsString()
  eventId: string;

  @ApiProperty({ description: 'Session Unique ID', example: 'sess-101' })
  @IsNotEmpty({ message: 'Session ID is required' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Poll Question Text', example: 'How useful was this session?' })
  @IsNotEmpty({ message: 'Poll question text cannot be empty' })
  @IsString()
  questionText: string;

  @ApiProperty({
    description: 'Poll Option Choices (Minimum 2 non-empty choices required)',
    example: ['Very useful', 'Useful', 'Neutral', 'Not useful'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'A poll must have at least 2 option choices' })
  @IsString({ each: true, message: 'Each poll option must be a valid string' })
  options: string[];

  @ApiPropertyOptional({ description: 'Initial Poll Status (LAUNCHED or DRAFT)', example: 'LAUNCHED' })
  @IsOptional()
  @IsString()
  status?: string;
}
