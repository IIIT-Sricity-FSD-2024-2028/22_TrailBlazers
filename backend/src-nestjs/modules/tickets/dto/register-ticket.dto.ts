import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterTicketDto {
  @ApiProperty({ description: 'Target Event ID', example: 'evt_100' })
  @IsString()
  @IsNotEmpty({ message: 'Valid event ID and a quantity of at least 1 ticket are required.' })
  eventId: string;

  @ApiProperty({ description: 'Number of tickets requested', example: 1, minimum: 1 })
  @IsInt({ message: 'Quantity must be an integer.' })
  @Min(1, { message: 'Valid event ID and a quantity of at least 1 ticket are required.' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Payment method (CARD / UPI / NETBANKING)', example: 'CARD' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Private invitation code if required for invitation-only event', example: 'INV-A1B2C3D4' })
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @ApiPropertyOptional({ description: 'Private invitation token if applicable', example: 'inv_tok_999' })
  @IsOptional()
  @IsString()
  invitationToken?: string;
}
