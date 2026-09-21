import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);

  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    @Inject('RESTAURANT_SERVICE') private restaurantClient: ClientProxy,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      this.logger.warn(`Client disconnected (No token): ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const response = await firstValueFrom(
        this.authClient.send({ cmd: 'validate_jwt' }, { token })
      );

      if (response && response.valid) {
        const user = response.user;
        const ownerId = user.sub;
        
        // Resolve outletId for joining room
        const restaurant = await firstValueFrom(
          this.restaurantClient.send({ cmd: 'get_restaurant_by_owner' }, { ownerId })
        );

        if (restaurant && restaurant.outlets && restaurant.outlets.length > 0) {
          const outletId = restaurant.outlets[0].id;
          
          // Join a room specific to this outlet for broadcast updates
          client.join(`outlet_${outletId}`);
          
          client.data = { user, outletId };
          this.logger.log(`Client connected and joined outlet_${outletId}: ${client.id}`);
        } else {
          this.logger.warn(`Client disconnected (No outlet found): ${client.id}`);
          client.disconnect();
        }
      } else {
        this.logger.warn(`Client disconnected (Invalid token): ${client.id}`);
        client.disconnect();
      }
    } catch (e: any) {
      this.logger.error(`Error authenticating socket: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Method to emit updates from the TCP controllers
  broadcastOrderUpdate(outletId: string, payload: any) {
    this.server.to(`outlet_${outletId}`).emit('order_update', payload);
  }
}
