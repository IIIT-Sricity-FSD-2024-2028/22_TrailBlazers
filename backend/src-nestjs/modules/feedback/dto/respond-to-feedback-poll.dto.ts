import { IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondToFeedbackPollDto {
  @ApiProperty({ description: 'Answers map payload mapping question ID to response value', example: { q_1: '5', q_2: 'Great event!' } })
  @IsNotEmpty({ message: 'Answers payload is required.' })
  @IsObject({ message: 'Answers payload is required.' })
  answers: Record<string, any>;
}
