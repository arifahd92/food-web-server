import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Sse,
  UseGuards,
  Headers,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Observable } from 'rxjs';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<OrderResponseDto> {
    if (idempotencyKey) {
      createOrderDto.idempotency_key = idempotencyKey;
    }
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(): Promise<OrderResponseDto[]> {
    return this.ordersService.findAll();
  }

  @Get('admin')
  findAllAdmin(
    @Query() dto: import('./dto/get-orders-admin.dto').GetOrdersAdminDto,
  ): Promise<
    import('./dto/paginated-order-response.dto').PaginatedOrderResponseDto
  > {
    return this.ordersService.findAllAdmin(dto);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.ordersService.getOrderStream();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, updateDto);
  }
}
