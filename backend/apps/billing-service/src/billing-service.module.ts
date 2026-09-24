import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BillingServiceController } from './billing-service.controller.js';
import { BillingService } from './billing-service.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ShiftsController } from './shifts.controller.js';
import { ShiftsService } from './shifts.service.js';
import { TaxesController } from './taxes.controller.js';
import { TaxesService } from './taxes.service.js';

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
  controllers: [BillingServiceController, ShiftsController, TaxesController],
  providers: [BillingService, ShiftsService, TaxesService]
})
export class BillingServiceModule {}
