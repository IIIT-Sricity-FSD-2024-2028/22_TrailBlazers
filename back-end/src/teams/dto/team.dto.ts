import { IsString, IsNotEmpty, IsIn, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'Alex Thompson', description: 'Team member name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'alex.t@wevents.com', description: 'Team member email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Scanner Operator', enum: ['Scanner Operator', 'Coordinator', 'Manager', 'Support'], description: 'Role in the team' })
  @IsIn(['Scanner Operator', 'Coordinator', 'Manager', 'Support'])
  teamRole: string;

  @ApiProperty({ example: 'e1', description: 'Event ID they are assigned to' })
  @IsString()
  @IsNotEmpty()
  eventId: string;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ example: 'Manager', enum: ['Scanner Operator', 'Coordinator', 'Manager', 'Support'] })
  @IsOptional()
  @IsIn(['Scanner Operator', 'Coordinator', 'Manager', 'Support'])
  teamRole?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'break', 'offline'] })
  @IsOptional()
  @IsIn(['active', 'break', 'offline'])
  status?: string;

  @ApiPropertyOptional({ example: 'e2', description: 'Re-assign to different event' })
  @IsOptional()
  @IsString()
  eventId?: string;
}
