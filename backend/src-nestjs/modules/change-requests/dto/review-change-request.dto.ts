import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewChangeRequestDto {
  @ApiProperty({ description: 'Review action (APPROVE / REJECT / QUOTATION_REVISION_REQUIRED)', example: 'APPROVE', enum: ['APPROVE', 'REJECT', 'QUOTATION_REVISION_REQUIRED'] })
  @IsString()
  @IsNotEmpty({ message: 'Change Request ID and action (APPROVE/REJECT) are required.' })
  @IsIn(['APPROVE', 'REJECT', 'QUOTATION_REVISION_REQUIRED'], {
    message: "Invalid review action. Must be 'APPROVE', 'REJECT', or 'QUOTATION_REVISION_REQUIRED'.",
  })
  action: 'APPROVE' | 'REJECT' | 'QUOTATION_REVISION_REQUIRED';

  @ApiPropertyOptional({ description: 'Reviewer comment or explanation', example: 'Approved, revised quotation sent' })
  @IsOptional()
  @IsString()
  reviewComment?: string;
}
