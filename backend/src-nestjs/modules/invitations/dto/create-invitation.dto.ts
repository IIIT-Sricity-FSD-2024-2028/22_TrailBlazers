import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Target Event ID', example: 'evt_100' })
  @IsString()
  @IsNotEmpty({ message: 'Event ID is required.' })
  eventId: string;

  @ApiProperty({ description: 'Recipient email address', example: 'guest@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Valid recipient email address is required.' })
  @IsNotEmpty({ message: 'Recipient email is required.' })
  recipientEmail: string;

  @ApiPropertyOptional({ description: 'Recipient full name', example: 'Guest User' })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Expiration period in days', example: 7, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Expiration in days must be at least 1.' })
  expiresInDays?: number;
}
