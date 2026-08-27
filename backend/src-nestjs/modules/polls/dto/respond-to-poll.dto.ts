import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondToPollDto {
  @ApiProperty({ description: 'Selected poll option ID', example: 'opt_g6_1' })
  @IsNotEmpty({ message: 'Option ID is required.' })
  @IsString()
  optionId: string;
}
