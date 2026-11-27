import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Registered user email address' })
  @IsEmail({}, { message: 'A valid email address is required.' })
  @IsNotEmpty({ message: 'Email address is required.' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Password reset verification code' })
  @IsString()
  @IsNotEmpty({ message: 'Reset verification code is required.' })
  code: string;

  @ApiProperty({ example: 'newPassword123', description: 'New password (min 6 characters)' })
  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  newPassword: string;
}

