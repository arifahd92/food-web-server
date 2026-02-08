import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({
    example: '64c9e13e8b0f3e6a12345678',
    description: 'MongoDB ID of the menu item',
  })
  @IsMongoId()
  @IsNotEmpty()
  menu_item_id: string;

  @ApiProperty({ example: 2, description: 'Quantity of the item', minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}

/**
 * DTO for creating a new order.
 * Frontend only sends customer details, items (ID + Quantity), and idempotency key.
 * Price and totals are NOT accepted from frontend.
 */
export class CreateOrderDto {
  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customer_name: string;

  @ApiProperty({ example: '123 Main St, Springfield', description: 'Delivery address' })
  @IsString()
  @IsNotEmpty()
  customer_address: string;

  @ApiProperty({ example: '555-0199', description: 'Contact phone number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\-\s\(\)]{7,20}$/, { message: 'Phone number must be valid (7-20 characters, digits, spaces, dashes, parens)' })
  @MaxLength(50)
  customer_phone: string;

  @ApiProperty({ example: 'john@example.com', description: 'Customer email for order tracking' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  customer_email: string;

  @ApiProperty({ type: [OrderItemDto], description: 'List of items in the order' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // idempotency_key is now passed via header 'Idempotency-Key'
  // idempotency_key: string; 
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'],
    example: 'PREPARING',
    description: 'New status for the order',
  })
  @IsEnum(['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'])
  status: string;
}
