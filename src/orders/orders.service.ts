import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './orders.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { Observable, interval, map, Subject } from 'rxjs';
import { MenuItem } from '../menu/menu.schema';
import { SocketService } from './socket.service';

@Injectable()
export class OrdersService implements OnModuleInit {
  private orderUpdates$ = new Subject<OrderResponseDto>();

  // -------------------------------------------------------------------------
  // IN-MEMORY IDEMPOTENCY STORE
  // LIMITATION: This map is local to the server instance. If the server restarts,
  // the map is cleared. In a distributed system with multiple instances,
  // this would require a shared store like Redis.
  // -------------------------------------------------------------------------
  private processingOrders = new Map<string, Promise<OrderResponseDto>>();

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
    private readonly socketService: SocketService,
  ) {}

  onModuleInit() {
    this.startStatusSimulator();
  }

  // Helper to map Mongoose doc to OrderResponseDto
  private mapOrderToResponseJson(order: any): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order._id.toString();
    dto.customer_name = order.customer_name;
    dto.customer_address = order.customer_address;
    dto.customer_phone = order.customer_phone;
    dto.status = order.status;
    dto.total_amount = order.total_amount;
    dto.created_at = order.created_at;
    dto.updated_at = order.updated_at;
    dto.items = order.items.map((i: any) => ({
      id: i._id?.toString() || '',
      menu_item_id: i.menu_item_id.toString(),
      name: i.name,
      image_url: i.image_url,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
    return dto;
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const idempotencyKey = createOrderDto.idempotency_key;

    // 1. Check in-memory processing map first
    if (this.processingOrders.has(idempotencyKey)) {
      const existingPromise = this.processingOrders.get(idempotencyKey);
      if (existingPromise) {
        return existingPromise;
      }
    }

    // 2. Create a promise for the processing logic
    const processingPromise = (async () => {
      try {
        // -------------------------------------------------------------------------
        // IDEMPOTENCY CHECK (DB fallback)
        // If an order with the same key exists in DB (e.g. from previous server run),
        // return it immediately.
        // -------------------------------------------------------------------------
        const existingOrder = await this.orderModel
          .findOne({ idempotency_key: idempotencyKey })
          .exec();

        if (existingOrder) {
          return this.mapOrderToResponseJson(existingOrder.toObject());
        }

        const menuIds = createOrderDto.items.map((i) => i.menu_item_id);
        const menuDocs = await this.menuItemModel.find({
          _id: { $in: menuIds },
        });
        const menuMap = new Map(menuDocs.map((m) => [m._id.toString(), m]));

        // -------------------------------------------------------------------------
        // ASSUMPTION: Backend is the source of truth.
        // We ignore any price sent from the frontend and recalculate strictly
        // based on the database 'MenuItem.price'.
        // -------------------------------------------------------------------------

        let total = 0;
        const orderItems = createOrderDto.items.map((i) => {
          const menu = menuMap.get(i.menu_item_id);
          if (!menu) {
            throw new NotFoundException(
              `Menu item with ID ${i.menu_item_id} not found`,
            );
          }

          const itemTotal = i.quantity * menu.price;
          total += itemTotal;

          return {
            menu_item_id: new Types.ObjectId(i.menu_item_id),
            quantity: i.quantity,
            unit_price: menu.price, // STRICT: Use price from DB
            name: menu.name,
            image_url: menu.image_url,
          };
        });

        const createdOrder = new this.orderModel({
          ...createOrderDto,
          total_amount: total,
          items: orderItems,
          status: 'order_received',
        });

        const saved = await createdOrder.save();
        const result = this.mapOrderToResponseJson(saved.toObject());
        this.orderUpdates$.next(result);
        return result;
      } catch (error) {
        // On failure, remove the key so the request can be retried
        this.processingOrders.delete(idempotencyKey);
        throw error;
      }
    })();

    // 3. Store the promise in the map
    this.processingOrders.set(idempotencyKey, processingPromise);

    // 4. Return the promise
    return processingPromise;
  }

  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.orderModel.find().sort({ createdAt: -1 }).exec();
    return orders.map((o) => this.mapOrderToResponseJson(o.toObject()));
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return this.mapOrderToResponseJson(order.toObject());
  }

  async updateStatus(
    id: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {

    const updatedOrderDoc = await this.orderModel.findById(id).exec();
    if (!updatedOrderDoc) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    const STATUS_FLOW = [
      'order_received',
      'preparing',
      'out_for_delivery',
      'delivered',
    ];

    const currentStatus = updatedOrderDoc.status;
    const newStatus = updateDto.status;
    const currentIdx = STATUS_FLOW.indexOf(currentStatus);
    const newIdx = STATUS_FLOW.indexOf(newStatus);

    // -------------------------------------------------------------------------
    // STRICT VALIDATION: Only allow forward transitions.
    // -------------------------------------------------------------------------
    if (newIdx < currentIdx || newIdx > currentIdx + 1) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    updatedOrderDoc.status = newStatus;
    const savedOrder = await updatedOrderDoc.save();

    const result = this.mapOrderToResponseJson(savedOrder.toObject());
    this.orderUpdates$.next(result);
    
    // Emit event via Socket.io
    this.socketService.emitOrderStatusUpdate(result.id, result.status);
    this.socketService.broadcastOrderUpdateToAll(result.id, result);

    return result;
  }

  getOrderStream(): Observable<MessageEvent> {
    return this.orderUpdates$.asObservable().pipe(
      map((order) => {
        return {
          data: JSON.stringify({ type: 'order_updated', order }),
        } as MessageEvent;
      }),
    );
  }

  private startStatusSimulator() {
    const STATUS_FLOW = [
      'order_received',
      'preparing',
      'out_for_delivery',
      'delivered',
    ];
    setInterval(async () => {
      try {
        const orders = await this.orderModel
          .find({ status: { $ne: 'delivered' } })
          .sort({ createdAt: 1 })
          .limit(5)
          .exec();

        for (const order of orders) {
          const idx = STATUS_FLOW.indexOf(order.status);
          if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
            const nextStatus = STATUS_FLOW[idx + 1];
            order.status = nextStatus;
            await order.save();
            const updated = this.mapOrderToResponseJson(order.toObject());
            this.orderUpdates$.next(updated);
          }
        }
      } catch (err) {
        console.error('Status simulator error:', err);
      }
    }, 15000);
    console.log('Order status simulator started (every 15s)');
  }
}
