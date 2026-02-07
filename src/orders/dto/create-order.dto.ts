import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  Max,
  IsInt,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  menu_item_id: string;

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
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  customer_address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customer_phone: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  idempotency_key: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(['order_received', 'preparing', 'out_for_delivery', 'delivered'])
  status: string;
}
