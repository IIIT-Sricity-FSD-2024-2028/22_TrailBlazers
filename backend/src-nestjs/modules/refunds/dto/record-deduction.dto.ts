import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordDeductionDto {
  @ApiProperty({ description: 'Verified non-recoverable expense or contractual deduction amount', example: 5000 })
  @IsNumber()
  @Min(0)
  deductionAmount: number;

  @ApiProperty({ description: 'Contractual justification or verified expense receipt explanation', example: 'Non-refundable venue deposit forfeited per clause 4.2' })
  @IsString()
  @IsNotEmpty()
  deductionReason: string;
}

