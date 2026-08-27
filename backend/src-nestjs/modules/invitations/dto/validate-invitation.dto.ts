import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateInvitationDto {
  @ApiProperty({ description: 'Target Event ID', example: 'evt_100' })
  @IsString()
  @IsNotEmpty({ message: 'Event ID is required.' })
  eventId: string;

  @ApiProperty({ description: 'Invitation code or secure token', example: 'INV-A1B2C3D4' })
  @IsString()
  @IsNotEmpty({ message: 'Invitation code or token is required.' })
  inviteCode: string;
}
