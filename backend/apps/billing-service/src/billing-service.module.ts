import { Module } from '@nestjs/common';
import { BillingServiceController } from './billing-service.controller.js';
import { BillingService } from './billing-service.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [BillingServiceController],
  providers: [BillingService],
})
export class BillingServiceModule {}
