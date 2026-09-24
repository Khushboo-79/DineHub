import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { KdsController } from './kds.controller.js';
import { KdsService } from './kds.service.js';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsService } from './integrations.service.js';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'RESTAURANT_SERVICE',
        transport: Transport.TCP,
        options: { host: process.env.RESTAURANT_SERVICE_HOST || 'restaurant-service', port: 3002 },
      },
      {
        name: 'MENU_SERVICE',
        transport: Transport.TCP,
        options: { host: process.env.MENU_SERVICE_HOST || 'menu-service', port: 3004 },
      },
      {
        name: 'INVENTORY_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
          queue: 'inventory_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController, KdsController, IntegrationsController],
  providers: [OrdersService, KdsService, IntegrationsService]
})
export class OrdersModule {}
