import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitEventFeedbackDto {
  @ApiProperty({ description: 'Event rating score between 1 and 5', example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty({ message: 'Rating is required.' })
  @IsNumber({}, { message: 'Rating must be an integer between 1 and 5.' })
  @Min(1, { message: 'Rating must be an integer between 1 and 5.' })
  @Max(5, { message: 'Rating must be an integer between 1 and 5.' })
  rating: number;

  @ApiPropertyOptional({ description: 'Attendee qualitative feedback comment', example: 'Great organization and excellent speakers!' })
  @IsOptional()
  @IsString()
  comment?: string;
}
