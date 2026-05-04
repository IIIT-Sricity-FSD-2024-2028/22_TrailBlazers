import { IsString, IsNotEmpty, IsEmail, IsOptional, IsIn, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRsvpDto {
  @ApiProperty({ example: 'e1', description: 'Event ID to RSVP for' })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({ example: 'Rahul Sharma', description: 'Attendee full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rahul.sharma@gmail.com', description: 'Attendee email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number — must be exactly 10 digits' })
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' })
  phone: string;

}

export class UpdateRsvpDto {
  @ApiPropertyOptional({ example: 'confirmed', enum: ['pending', 'confirmed', 'cancelled', 'attended'] })
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled', 'attended'])
  status?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'new.email@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
