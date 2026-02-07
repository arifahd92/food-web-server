import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Handles user connection and disconnection events
 * Manages client lifecycle (connect, disconnect, reconnect)
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class UserConnectionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UserConnectionGateway.name);
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    this.server.emit('userConnected', {
      clientId: client.id,
      totalClients: this.connectedClients.size,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.server.emit('userDisconnected', {
      clientId: client.id,
      totalClients: this.connectedClients.size,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Ping from ${client.id}`);
    client.emit('pong');
  }

  /**
   * Get total number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get all connected client IDs
   */
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys());
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    } else {
      this.logger.warn(`Client ${clientId} not found`);
    }
  }
}
