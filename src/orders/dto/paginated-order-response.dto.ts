import { Expose, Type } from 'class-transformer';
import { OrderResponseDto } from './order-response.dto';

export class PaginatedOrderResponseDto {
  @Expose()
  @Type(() => OrderResponseDto)
  items: OrderResponseDto[];

  @Expose()
  nextCursor: string | null;

  @Expose()
  limit: number;
}
