import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinOrderRoom')
  handleJoinOrderRoom(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(orderId);
    console.log(`Client ${client.id} joined room ${orderId}`);
  }

  emitOrderStatusUpdate(orderId: string, status: string) {
    this.server.to(orderId).emit('orderStatusUpdated', { orderId, status });
  }
}
