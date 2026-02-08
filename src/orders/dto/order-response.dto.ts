import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  menu_item_id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  image_url: string;

  @ApiProperty()
  @Expose()
  quantity: number;

  @ApiProperty()
  @Expose()
  unit_price: number;
}

/**
 * DTO for the Order response.
 * This represents the computed state of the order from the backend.
 * Frontend should use this for display.
 */
export class OrderResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  customer_name: string;

  @ApiProperty()
  @Expose()
  customer_address: string;

  @ApiProperty()
  @Expose()
  customer_phone: string;

  @ApiProperty()
  @Expose()
  customer_email: string;

  @ApiProperty({
    enum: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'],
    example: 'RECEIVED',
    description: 'Current status of the order',
  })
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  total_amount: number;

  @ApiProperty()
  @Expose()
  created_at: Date;

  @ApiProperty()
  @Expose()
  updated_at: Date;

  @ApiProperty({ type: [OrderItemResponseDto] })
  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];
}
