import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LineItemDto {
  @ApiPropertyOptional({ description: 'Line item description', example: 'Venue Hall Rental (Full Day)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Quantity of items or hours', example: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price per item/hour', example: 2500 })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class CreateQuotationDto {
  @ApiProperty({ description: 'Target Event Request ID', example: 'req_ab1234' })
  @IsString()
  @IsNotEmpty({ message: 'Event Request ID is required.' })
  eventRequestId: string;

  @ApiPropertyOptional({ type: [LineItemDto], description: 'Detailed commercial quotation line items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems?: LineItemDto[];

  @ApiPropertyOptional({ description: 'Discount amount', example: 200 })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Tax percentage rate', example: 18 })
  @IsOptional()
  @IsNumber()
  taxPercent?: number;

  @ApiPropertyOptional({ description: 'Quotation notes', example: 'Includes AV setup and stage lighting' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Payment and service terms', example: '50% advance payment required upon acceptance' })
  @IsOptional()
  @IsString()
  terms?: string;
}
