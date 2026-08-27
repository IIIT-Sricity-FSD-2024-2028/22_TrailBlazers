import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueInvitationDto {
  @ApiProperty({ description: 'Recipient email address', example: 'vip@example.com' })
  @IsString()
  @IsNotEmpty({ message: 'Valid recipient email address is required.' })
  @IsEmail({}, { message: 'Valid recipient email address is required.' })
  recipientEmail: string;

  @ApiPropertyOptional({ description: 'Recipient full name', example: 'Jane VIP' })
  @IsOptional()
  @IsString()
  recipientName?: string;
}
