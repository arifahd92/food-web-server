import { Injectable } from '@nestjs/common';
import { UserConnectionGateway } from './gateways/user-connection.gateway';
import { OrderUpdatesGateway } from './gateways/order-updates.gateway';

/**
 * Socket.IO Service
 * Centralized service for managing WebSocket events and communications
 * Acts as a facade for user connection and order update gateways
 */
@Injectable()
export class SocketService {
  constructor(
    private readonly userConnectionGateway: UserConnectionGateway,
    private readonly orderUpdatesGateway: OrderUpdatesGateway,
  ) {}

  /**
   * Get connection stats
   */
  getConnectionStats() {
    return {
      totalConnectedClients: this.userConnectionGateway.getConnectedClientsCount(),
      connectedClientIds: this.userConnectionGateway.getConnectedClients(),
      activeOrderRooms: this.orderUpdatesGateway.getActiveOrderRooms(),
    };
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(event: string, data: any) {
    this.userConnectionGateway.broadcastToAll(event, data);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, event: string, data: any) {
    this.userConnectionGateway.sendToClient(clientId, event, data);
  }

  /**
   * Emit order status update to specific order room
   */
  emitOrderStatusUpdate(orderId: string, status: string) {
    this.orderUpdatesGateway.emitOrderStatusUpdate(orderId, status);
  }

  /**
   * Broadcast order update to specific order room
   */
  broadcastOrderUpdate(orderId: string, orderData: any) {
    this.orderUpdatesGateway.broadcastOrderUpdate(orderId, orderData);
  }

  /**
   * Get clients in an order room
   */
  getOrderRoomClients(orderId: string) {
    return {
      count: this.orderUpdatesGateway.getOrderRoomClients(orderId),
      clientIds: this.orderUpdatesGateway.getOrderRoomClientIds(orderId),
    };
  }

  /**
   * Broadcast to all users about an order update
   */
  broadcastOrderUpdateToAll(orderId: string, orderData: any) {
    this.broadcastToAll('orderUpdated', {
      orderId,
      ...orderData,
      timestamp: new Date(),
    });
  }
}
