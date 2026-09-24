import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service.js';
import { RestaurantsController } from './restaurants.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TablesController } from './tables.controller.js';
import { TablesService } from './tables.service.js';
import { CrmController } from './crm.controller.js';
import { CrmService } from './crm.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RestaurantsController, TablesController, CrmController],
  providers: [RestaurantsService, TablesService, CrmService],
})
export class RestaurantsModule {}
