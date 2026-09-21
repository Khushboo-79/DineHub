import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'RESTAURANT_SERVICE',
        transport: Transport.TCP,
        options: { host: process.env.RESTAURANT_SERVICE_HOST || 'restaurant-service', port: 3002 },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService]
})
export class InventoryModule {}
