import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOperationalStatusDto {
  @ApiProperty({ description: 'Target operational status (CHECK_IN_OPEN, LIVE, COMPLETED)', example: 'LIVE', enum: ['CHECK_IN_OPEN', 'LIVE', 'COMPLETED'] })
  @IsString()
  @IsNotEmpty({ message: 'Operational status is required.' })
  @IsIn(['CHECK_IN_OPEN', 'LIVE', 'COMPLETED'], {
    message: 'Invalid operational status. Must be one of: CHECK_IN_OPEN, LIVE, COMPLETED',
  })
  operationalStatus: string;
}
