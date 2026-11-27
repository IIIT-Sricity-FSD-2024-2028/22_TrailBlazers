import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteRefundDto {
  @ApiProperty({ description: 'Actual transaction or settlement reference ID', example: 'REF-TXN-2026-89412034' })
  @IsString()
  @IsNotEmpty()
  refundTransactionId: string;

  @ApiPropertyOptional({ description: 'Refund disbursement method (UPI, NEFT, CARD, ORIGINAL_PAYMENT)', example: 'UPI' })
  @IsOptional()
  @IsString()
  refundMethod?: string;

  @ApiPropertyOptional({ description: 'Actual amount disbursed', example: 1075 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualRefundedAmount?: number;

  @ApiPropertyOptional({ description: 'Settlement notes or confirmation details' })
  @IsOptional()
  @IsString()
  notes?: string;
}

