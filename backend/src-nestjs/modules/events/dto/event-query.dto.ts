import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EventQueryDto {
  @ApiPropertyOptional({ example: 'Tech', description: 'Search term for event name or organization' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Tech Conference', description: 'Filter by event category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'free', description: 'Price filter (all, free, paid)' })
  @IsOptional()
  @IsString()
  priceFilter?: string;

  @ApiPropertyOptional({ example: 'OPEN', description: 'Event type (OPEN, EXCLUSIVE)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Bangalore', description: 'Filter by location' })
  @IsOptional()
  @IsString()
  location?: string;
}
