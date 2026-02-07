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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PaginatedOrderResponseDto } from './dto/paginated-order-response.dto';
import { GetOrdersAdminDto } from './dto/get-orders-admin.dto';

@ApiTags('Orders')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Unique key to key prevent duplicate orders',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
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
  @ApiOperation({ summary: 'Get all orders (Public/Simple list)' })
  @ApiResponse({
    status: 200,
    description: 'List of all orders.',
    type: [OrderResponseDto],
  })
  findAll(): Promise<OrderResponseDto[]> {
    return this.ordersService.findAll();
  }

  @Get('admin')
  @ApiTags('Admin')
  @ApiOperation({ summary: 'Get all orders with cursor-based pagination (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of orders.',
    type: PaginatedOrderResponseDto,
  })
  findAllAdmin(
    @Query() dto: GetOrdersAdminDto,
  ): Promise<PaginatedOrderResponseDto> {
    return this.ordersService.findAllAdmin(dto);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Subscribe to order updates via SSE (Server-Sent Events)' })
  stream(): Observable<MessageEvent> {
    return this.ordersService.getOrderStream();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'The order details.',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiTags('Admin')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'The order status has been updated.',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(id, updateDto);
  }
}
