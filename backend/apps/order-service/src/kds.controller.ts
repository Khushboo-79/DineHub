import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KdsService } from './kds.service.js';

@Controller()
export class KdsController {
  constructor(private readonly kdsService: KdsService) {}

  @MessagePattern({ cmd: 'get_active_tickets' })
  getActiveTickets(@Payload() data: { outletId: string }) {
    return this.kdsService.getActiveTickets(data.outletId);
  }

  @MessagePattern({ cmd: 'update_item_status' })
  updateItemStatus(@Payload() data: { itemId: string; status: import('@prisma/client/order/index.js').OrderItemStatus }) {
    return this.kdsService.updateItemStatus(data.itemId, data.status);
  }

  @MessagePattern({ cmd: 'get_expediter_view' })
  getExpediterView(@Payload() data: { outletId: string }) {
    return this.kdsService.getExpediterView(data.outletId);
  }
}
