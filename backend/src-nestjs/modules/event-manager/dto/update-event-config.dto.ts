import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventConfigDto {
  @ApiPropertyOptional({ description: 'Registration status (OPEN / CLOSED / INVITATION_ONLY)', example: 'OPEN' })
  @IsOptional()
  @IsString()
  registrationStatus?: string;

  @ApiPropertyOptional({ description: 'Registration deadline (YYYY-MM-DD)', example: '2026-10-01' })
  @IsOptional()
  @IsString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ description: 'Expected attendance capacity', example: 600 })
  @IsOptional()
  @IsNumber()
  expectedAttendance?: number;

  @ApiPropertyOptional({ description: 'Commercial ticket price (read-only / protection enforced)', example: 150 })
  @IsOptional()
  @IsNumber()
  ticketPrice?: number;
}
