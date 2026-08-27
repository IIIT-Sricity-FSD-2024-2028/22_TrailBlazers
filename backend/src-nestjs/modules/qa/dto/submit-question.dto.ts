import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitQuestionDto {
  @ApiProperty({ description: 'Question text submitted by attendee', example: 'Will session slides be made available for download?' })
  @IsNotEmpty({ message: 'Question text is required.' })
  @IsString()
  questionText: string;

  @ApiPropertyOptional({ description: 'Specific session ID if question belongs to a breakout session', example: 'sess_100' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
