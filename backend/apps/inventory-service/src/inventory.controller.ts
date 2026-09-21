import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { InventoryService } from './inventory.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern({ cmd: 'create_inventory_item' })
  create(@Payload() data: { ownerId: string; dto: CreateInventoryItemDto }) {
    return this.inventoryService.create(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_inventory' })
  getInventory(@Payload() data: { ownerId: string, page?: number, limit?: number }) {
    return this.inventoryService.getInventory(data.ownerId, data.page, data.limit);
  }

  @MessagePattern({ cmd: 'get_inventory_item' })
  findOne(@Payload() data: { ownerId: string; id: string }) {
    return this.inventoryService.findOne(data.ownerId, data.id);
  }

  @MessagePattern({ cmd: 'update_inventory_item' })
  update(@Payload() data: { ownerId: string; id: string; dto: UpdateInventoryItemDto }) {
    return this.inventoryService.update(data.ownerId, data.id, data.dto);
  }

  @MessagePattern({ cmd: 'delete_inventory_item' })
  remove(@Payload() data: { ownerId: string; id: string }) {
    return this.inventoryService.remove(data.ownerId, data.id);
  }

  @EventPattern('order_placed')
  async handleOrderPlaced(@Payload() order: any) {
    // Background Job: Deduct inventory based on order items
    console.log(`[RabbitMQ] Received order_placed event for Order ID: ${order.id}`);
    await this.inventoryService.deductInventoryForOrder(order);
  }
}
