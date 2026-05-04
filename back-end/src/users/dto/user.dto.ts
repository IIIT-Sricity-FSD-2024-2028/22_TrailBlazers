import { IsString, IsNotEmpty, IsEmail, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Rajesh Kumar', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rajesh@gmail.com', description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'eventmanager', enum: ['superuser', 'eventmanager', 'client', 'osc', 'attendee'], description: 'User role' })
  @IsIn(['superuser', 'eventmanager', 'client', 'osc', 'attendee'])
  role: string;

  @ApiPropertyOptional({ example: 'Tech Conferences', description: 'Domain (applicable for eventmanager and client)' })
  @IsOptional()
  @IsString()
  domain?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Rajesh Kumar Updated' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'rajesh.new@gmail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'attendee', enum: ['superuser', 'eventmanager', 'client', 'osc', 'attendee'] })
  @IsOptional()
  @IsIn(['superuser', 'eventmanager', 'client', 'osc', 'attendee'])
  role?: string;

  @ApiPropertyOptional({ example: 'Marketing Events' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive', 'suspended'] })
  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}
