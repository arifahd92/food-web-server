import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './orders.schema';
import { MenuItem, MenuItemSchema } from '../menu/menu.schema';
// import { OrdersGateway } from './orders.gateway';
import { UserConnectionGateway } from './gateways/user-connection.gateway';
import { OrderUpdatesGateway } from './gateways/order-updates.gateway';
import { SocketService } from './socket.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    // OrdersGateway, // Removed as it is redundant
    UserConnectionGateway,
    OrderUpdatesGateway,
    SocketService,
  ],
  exports: [SocketService],
})
export class OrdersModule {}
