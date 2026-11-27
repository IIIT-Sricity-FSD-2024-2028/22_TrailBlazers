import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveRefundDto {
  @ApiPropertyOptional({ description: 'Final verified deduction amount', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductionAmount?: number;

  @ApiPropertyOptional({ description: 'Explanation of deduction if any' })
  @IsOptional()
  @IsString()
  deductionReason?: string;

  @ApiPropertyOptional({ description: 'Approval notes by Revenue team member' })
  @IsOptional()
  @IsString()
  notes?: string;
}

