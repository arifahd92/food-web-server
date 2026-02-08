import { Expose, Type } from 'class-transformer';
import { OrderResponseDto } from './order-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedOrderResponseDto {
  @ApiProperty({ type: [OrderResponseDto], description: 'List of orders for the current page' })
  @Expose()
  @Type(() => OrderResponseDto)
  items: OrderResponseDto[];

  @ApiProperty({
    nullable: true,
    description: 'Opaque cursor for the next page, or null if no more items',
    example: 'eyJ1cGRhdGVkQXQiOiIyMDIzLTA4LTAxVDEyOjAwOjAwLjAwMFoiLCJpZCI6IjY0YzlhmMxMjM0NTY3OCJ9',
  })
  @Expose()
  nextCursor: string | null;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  @Expose()
  limit: number;
}
