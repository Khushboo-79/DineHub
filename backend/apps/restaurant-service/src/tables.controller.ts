import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TablesService } from './tables.service.js';

@Controller()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @MessagePattern({ cmd: 'create_zone' })
  createZone(@Payload() data: { outletId: string; name: string; description?: string }) {
    return this.tablesService.createZone(data.outletId, data.name, data.description);
  }

  @MessagePattern({ cmd: 'create_table' })
  createTable(@Payload() data: { zoneId: string; name: string; capacity: number }) {
    return this.tablesService.createTable(data.zoneId, data.name, data.capacity);
  }

  @MessagePattern({ cmd: 'get_live_status' })
  getLiveStatus(@Payload() data: { outletId: string }) {
    return this.tablesService.getLiveStatus(data.outletId);
  }

  @MessagePattern({ cmd: 'create_reservation' })
  createReservation(@Payload() data: { outletId: string; dto: any }) {
    return this.tablesService.createReservation(data.outletId, data.dto);
  }

  @MessagePattern({ cmd: 'assign_table' })
  assignTable(@Payload() data: { tableId: string; status: import('@prisma/client/restaurant/index.js').TableStatus }) {
    return this.tablesService.assignTable(data.tableId, data.status);
  }
}
