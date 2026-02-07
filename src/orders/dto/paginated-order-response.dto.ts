import { Expose, Type } from 'class-transformer';
import { OrderResponseDto } from './order-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedOrderResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  @Expose()
  @Type(() => OrderResponseDto)
  items: OrderResponseDto[];

  @ApiProperty({ nullable: true, description: 'Cursor for the next page, or null if no more items' })
  @Expose()
  nextCursor: string | null;

  @ApiProperty({ example: 10 })
  @Expose()
  limit: number;
}
