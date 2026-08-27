import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCoordinatorDto {
  @ApiProperty({ description: 'Onsite Coordinator User ID', example: 'usr_coord_100' })
  @IsString()
  @IsNotEmpty({ message: 'Coordinator User ID is required.' })
  coordinatorUserId: string;
}
