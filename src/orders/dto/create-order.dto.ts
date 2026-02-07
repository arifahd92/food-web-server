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
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  menu_item_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsPositive()
  unit_price: number;
}

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
}

export class UpdateOrderStatusDto {
  @IsEnum(['order_received', 'preparing', 'out_for_delivery', 'delivered'])
  status: string;
}
