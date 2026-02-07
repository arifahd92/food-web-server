import { Expose, Type } from 'class-transformer';

export class OrderItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  menu_item_id: string;

  @Expose()
  name: string;

  @Expose()
  image_url: string;

  @Expose()
  quantity: number;

  @Expose()
  unit_price: number;
}

/**
 * DTO for the Order response.
 * This represents the computed state of the order from the backend.
 * Frontend should use this for display.
 */
export class OrderResponseDto {
  @Expose()
  id: string;

  @Expose()
  customer_name: string;

  @Expose()
  customer_address: string;

  @Expose()
  customer_phone: string;

  @Expose()
  status: string;

  @Expose()
  total_amount: number;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];
}
