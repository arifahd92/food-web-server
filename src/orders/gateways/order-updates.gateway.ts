import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Handles order-related WebSocket events
 * Manages order subscriptions, updates, and room-based broadcasting
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrderUpdatesGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrderUpdatesGateway.name);
  private orderRooms = new Map<string, Set<string>>(); // orderId -> Set of clientIds

  /**
   * Subscribe to order updates
   * Joins client to order-specific room
   */
  @SubscribeMessage('joinOrderRoom')
  handleJoinOrderRoom(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!orderId) {
      this.logger.warn('Invalid orderId for joinOrderRoom');
      return;
    }

    client.join(orderId);

    // Track which clients are in this room
    if (!this.orderRooms.has(orderId)) {
      this.orderRooms.set(orderId, new Set());
    }
    this.orderRooms.get(orderId)?.add(client.id);

    this.logger.log(
      `Client ${client.id} joined order room ${orderId}. Total clients in room: ${this.orderRooms?.get?.(orderId)?.size}`,
    );

    // Notify room that a new client joined
    this.server.to(orderId).emit('clientJoinedOrder', {
      orderId,
      clientId: client.id,
      clientsInRoom: this.orderRooms?.get?.(orderId)?.size,
    });
  }

  /**
   * Leave order room
   */
  @SubscribeMessage('leaveOrderRoom')
  handleLeaveOrderRoom(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(orderId);

    if (this.orderRooms.has(orderId)) {
      this.orderRooms.get(orderId)?.delete(client.id);
      const remaining = this.orderRooms?.get?.(orderId)?.size;

      this.logger.log(
        `Client ${client.id} left order room ${orderId}. Remaining clients: ${remaining}`,
      );

      if (remaining === 0) {
        this.orderRooms.delete(orderId);
      }

      this.server.to(orderId).emit('clientLeftOrder', {
        orderId,
        clientId: client.id,
        clientsInRoom: remaining,
      });
    }
  }

  /**
   * Emit order status update to all clients in the order room
   */
  emitOrderStatusUpdate(orderId: string, status: string) {
    this.logger.debug(`Emitting status update for order ${orderId}: ${status}`);
    this.server.to(orderId).emit('orderStatusUpdated', {
      orderId,
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Subscribe to admin updates
   */
  @SubscribeMessage('joinAdminRoom')
  handleJoinAdminRoom(
    @ConnectedSocket() client: Socket,
  ) {
    client.join('admin');
    this.logger.log(`Client ${client.id} joined admin room`);
  }

  /**
   * Broadcast order update to all clients in the order room AND admin room
   */
  broadcastOrderUpdate(orderId: string, orderData: any) {
    this.logger.debug(`Broadcasting order update for ${orderId}`);

    // Emit to specific order room (for Buyer tracking)
    this.server.to(orderId).emit('orderUpdated', {
      orderId,
      ...orderData,
      timestamp: new Date(),
    });

    // Emit to admin room (for Dashboard)
    this.server.to('admin').emit('orderUpdated', {
      orderId,
      ...orderData,
      timestamp: new Date(),
    });
  }

  /**
   * Get number of clients in an order room
   */
  getOrderRoomClients(orderId: string): number {
    return this.orderRooms.get(orderId)?.size || 0;
  }

  /**
   * Get all client IDs in an order room
   */
  getOrderRoomClientIds(orderId: string): string[] {
    return Array.from(this.orderRooms.get(orderId) || new Set());
  }

  /**
   * Get all active order rooms
   */
  getActiveOrderRooms(): string[] {
    return Array.from(this.orderRooms.keys());
  }
}
