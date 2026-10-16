import { IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptQuotationDto {
  @ApiPropertyOptional({ description: 'Client confirmed agreement with payment terms', example: true })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiPropertyOptional({ description: 'Accepted payment schedule details' })
  @IsOptional()
  @IsObject()
  paymentSchedule?: {
    advancePercent?: number;
    advanceAmount?: number;
    milestonePercent?: number;
    milestoneAmount?: number;
    finalPercent?: number;
    finalAmount?: number;
  };
}
