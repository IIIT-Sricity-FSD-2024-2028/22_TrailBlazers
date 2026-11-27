import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectRefundDto {
  @ApiProperty({ description: 'Mandatory reason for refund rejection', example: 'Event proceeded on schedule; attendee attended all sessions' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

