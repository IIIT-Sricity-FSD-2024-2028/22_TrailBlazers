import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class PayQuotationDto {
  @ApiProperty({
    description: 'Payment method chosen by client',
    example: 'UPI',
    enum: ['UPI', 'CARD', 'NET_BANKING'],
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Amount to pay (validated and enforced against next milestone schedule)',
    example: 35000,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Optional client payment reference or notes',
    example: 'Advance payment for venue & catering lock',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
