import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedbackQuestionDto {
  @ApiProperty({ description: 'Question text for survey item', example: 'How satisfied were you with venue catering?' })
  @IsNotEmpty()
  @IsString()
  questionText: string;

  @ApiPropertyOptional({ description: 'Question response type (RATING, TEXT, MULTIPLE_CHOICE)', example: 'RATING' })
  @IsOptional()
  @IsString()
  questionType?: string;

  @ApiPropertyOptional({ description: 'Options JSON array for multiple choice questions', example: ['Poor', 'Average', 'Good', 'Excellent'] })
  @IsOptional()
  options?: any;
}

export class CreateFeedbackPollDto {
  @ApiProperty({ description: 'Target Event ID', example: 'evt_100' })
  @IsNotEmpty({ message: 'Event ID and poll title are required.' })
  @IsString()
  eventId: string;

  @ApiProperty({ description: 'Survey poll title', example: 'Post-Event Satisfaction Survey' })
  @IsNotEmpty({ message: 'Event ID and poll title are required.' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Survey poll description', example: 'Please take 2 minutes to provide feedback.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [FeedbackQuestionDto], description: 'List of survey questions' })
  @IsOptional()
  @IsArray()
  questions?: FeedbackQuestionDto[];

  @ApiPropertyOptional({ description: 'Poll initial status (DRAFT / PUBLISHED)', example: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;
}
