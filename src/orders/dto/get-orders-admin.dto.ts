import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetOrdersAdminDto {
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 20, description: 'Number of items to return' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Opaque cursor string for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
