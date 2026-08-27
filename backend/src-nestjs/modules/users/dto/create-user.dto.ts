import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'User Full Name', example: 'Sarah Connor' })
  @IsNotEmpty({ message: 'User name is required' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User Email Address', example: 'sarah@company.com' })
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @ApiProperty({ description: 'Application Role', example: 'CLIENT' })
  @IsNotEmpty({ message: 'Role selection is required' })
  @IsString()
  role: string;

  @ApiPropertyOptional({ description: 'Organization Name', example: 'Tech Corp' })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional({ description: 'Department Name', example: 'EVENT_MANAGEMENT' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Initial Plaintext Password (If omitted, a secure password will be generated)', example: 'SecureP@ss2026' })
  @IsOptional()
  @IsString()
  password?: string;
}
