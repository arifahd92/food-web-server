import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: '64c9e13e8b0f3e6a12345678', description: 'MongoDB ObjectID' })
  @Expose()
  id: string;

  @ApiProperty({ example: '64c9e13e8b0f3e6a12345678', description: 'Menu Item MongoDB ObjectID' })
  @Expose()
  menu_item_id: string;

  @ApiProperty({ example: 'Cheeseburger', description: 'Name of the item' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'https://example.com/images/burger.jpg', description: 'Image URL of the item' })
  @Expose()
  image_url: string;

  @ApiProperty({ example: 2, description: 'Quantity ordered' })
  @Expose()
  quantity: number;

  @ApiProperty({ example: 12.99, description: 'Unit price at the time of order' })
  @Expose()
  unit_price: number;
}

/**
 * DTO for the Order response.
 * This represents the computed state of the order from the backend.
 * Frontend should use this for display.
 */
export class OrderResponseDto {
  @ApiProperty({ example: '64c9e13e8b0f3e6a12345678', description: 'Order ID' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  @Expose()
  customer_name: string;

  @ApiProperty({ example: '123 Main St, Springfield', description: 'Delivery address' })
  @Expose()
  customer_address: string;

  @ApiProperty({ example: '555-0199', description: 'Customer contact phone' })
  @Expose()
  customer_phone: string;

  @ApiProperty({ example: 'john@example.com', description: 'Customer email' })
  @Expose()
  customer_email: string;

  @ApiProperty({
    enum: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'],
    example: 'RECEIVED',
    description: 'Current status of the order',
  })
  @Expose()
  status: string;

  @ApiProperty({ example: 25.98, description: 'Total order amount' })
  @Expose()
  total_amount: number;

  @ApiProperty({ example: '2023-08-01T12:00:00.000Z', description: 'Order creation timestamp' })
  @Expose()
  created_at: Date;

  @ApiProperty({ example: '2023-08-01T12:30:00.000Z', description: 'Last update timestamp' })
  @Expose()
  updated_at: Date;

  @ApiProperty({ type: [OrderItemResponseDto], description: 'List of items in the order' })
  @Expose()
  @Type(() => OrderItemResponseDto)
  items: OrderItemResponseDto[];
}
