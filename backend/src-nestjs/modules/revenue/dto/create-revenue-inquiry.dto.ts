import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRevenueInquiryDto {
  @ApiPropertyOptional({ description: 'Optional Event Request ID associated with the inquiry' })
  @IsOptional()
  @IsString()
  eventRequestId?: string;

  @ApiProperty({ description: 'Client organization name', example: 'Global Tech Forum' })
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required.' })
  organizationName: string;

  @ApiProperty({ description: 'Client contact email address', example: 'contact@organization.com' })
  @IsEmail({}, { message: 'Valid contact email address is required.' })
  @IsNotEmpty({ message: 'Contact email is required.' })
  contactEmail: string;

  @ApiProperty({ description: 'Pricing inquiry or commercial question' })
  @IsString()
  @IsNotEmpty({ message: 'Inquiry message is required.' })
  message: string;
}
