import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BillingServiceController } from './billing-service.controller.js';
import { BillingService } from './billing-service.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'RESTAURANT_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3002 },
      },
    ]),
  ],
  controllers: [BillingServiceController],
  providers: [BillingService]
})
export class BillingServiceModule {}
