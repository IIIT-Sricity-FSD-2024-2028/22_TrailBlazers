import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: '123456', description: 'Six-digit verification code' })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required.' })
  code: string;
}
