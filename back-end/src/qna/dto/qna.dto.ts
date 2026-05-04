import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty({ example: 'e1', description: 'Event ID the question belongs to' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'What is the dress code for the event?', description: 'The question asked by the attendee' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'rahul.s@gmail.com', description: 'Email of the attendee asking the question' })
  @IsString()
  @IsNotEmpty()
  askedBy: string;
}

export class AnswerQuestionDto {
  @ApiProperty({ example: 'Smart casual attire is recommended.', description: 'The answer provided by the client or eventmanager' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ example: 'u4', description: 'ID of the user providing the answer' })
  @IsOptional()
  @IsString()
  answeredBy?: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Is parking available at the venue?', description: 'Updated question text' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  question?: string;
}
