import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './orders.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { Observable, interval, map, Subject } from 'rxjs';
import { MenuItem } from '../menu/menu.schema';
import { SocketService } from './socket.service';

export interface OrderWithItems {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  status: string;
  total_amount: number;
  created_at: Date;
  updated_at: Date;
  items: {
    id: string;
    order_id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    name?: string;
    image_url?: string;
  }[];
}

@Injectable()
export class OrdersService implements OnModuleInit {
  private orderUpdates$ = new Subject<OrderWithItems>();

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
    private readonly socketService: SocketService,
  ) {}

  onModuleInit() {
    this.startStatusSimulator();
  }

  // Helper to map Mongoose doc to OrderWithItems
  private mapOrderToWithItems(order: any): OrderWithItems {
    return {
      id: order._id.toString(),
      customer_name: order.customer_name,
      customer_address: order.customer_address,
      customer_phone: order.customer_phone,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: order.items.map((i: any) => ({
        id: i._id?.toString() || '',
        order_id: order._id.toString(),
        menu_item_id: i.menu_item_id.toString(),
        quantity: i.quantity,
        unit_price: i.unit_price,
        name: i.name,
        image_url: i.image_url,
      })),
    };
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderWithItems> {
    const menuIds = createOrderDto.items.map((i) => i.menu_item_id);
    const menuDocs = await this.menuItemModel.find({ _id: { $in: menuIds } });
    const menuMap = new Map(menuDocs.map((m) => [m._id.toString(), m]));

    let total = 0;
    const orderItems = createOrderDto.items.map((i) => {
      const menu = menuMap.get(i.menu_item_id);
      total += i.quantity * i.unit_price;
      return {
        menu_item_id: new Types.ObjectId(i.menu_item_id),
        quantity: i.quantity,
        unit_price: i.unit_price,
        name: menu?.name,
        image_url: menu?.image_url,
      };
    });

    const createdOrder = new this.orderModel({
      ...createOrderDto,
      total_amount: total,
      items: orderItems,
      status: 'order_received',
    });

    const saved = await createdOrder.save();
    const result = this.mapOrderToWithItems(saved.toObject());
    this.orderUpdates$.next(result);
    return result;
  }

  async findAll(): Promise<OrderWithItems[]> {
    const orders = await this.orderModel.find().sort({ createdAt: -1 }).exec();
    return orders.map((o) => this.mapOrderToWithItems(o.toObject()));
  }

  async findOne(id: string): Promise<OrderWithItems> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return this.mapOrderToWithItems(order.toObject());
  }

  async updateStatus(
    id: string,
    updateDto: UpdateOrderStatusDto,
  ): Promise<OrderWithItems> {
    const updatedOrderDoc = await this.orderModel
      .findByIdAndUpdate(id, { status: updateDto.status }, { new: true })
      .exec();

    if (!updatedOrderDoc) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    const result = this.mapOrderToWithItems(updatedOrderDoc.toObject());
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
            const updated = this.mapOrderToWithItems(order.toObject());
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
