import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePollDto {
  @ApiProperty({ example: 'e1', description: 'Event ID this poll belongs to' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'Which session did you enjoy most?', description: 'The poll question' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: ['Keynote', 'Workshop A', 'Workshop B'], description: 'List of answer options (min 2)' })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiPropertyOptional({ example: 'c1', description: 'Client ID who created the poll' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class VotePollDto {
  @ApiProperty({ example: 'Workshop A', description: 'The option the attendee is voting for' })
  @IsString()
  @IsNotEmpty()
  option: string;

  @ApiProperty({ example: 'rahul.s@gmail.com', description: 'Voter email (attendee)' })
  @IsString()
  @IsNotEmpty()
  voterEmail: string;
}

export class UpdatePollDto {
  @ApiPropertyOptional({ example: 'Updated question text?', description: 'Update the poll question' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  question?: string;

  @ApiPropertyOptional({ example: ['Option A', 'Option B', 'Option C'], description: 'Update poll options' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 'open', enum: ['open', 'closed'], description: 'Poll status' })
  @IsOptional()
  @IsIn(['open', 'closed'])
  status?: string;
}
