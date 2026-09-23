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

  // --- Suppliers ---

  @MessagePattern({ cmd: 'create_supplier' })
  createSupplier(@Payload() data: { ownerId: string; dto: import('./dto/supplier.dto.js').CreateSupplierDto }) {
    return this.inventoryService.createSupplier(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_suppliers' })
  getSuppliers(@Payload() data: { ownerId: string }) {
    return this.inventoryService.getSuppliers(data.ownerId);
  }

  @MessagePattern({ cmd: 'get_supplier_by_id' })
  getSupplierById(@Payload() data: { ownerId: string; id: string }) {
    return this.inventoryService.getSupplierById(data.ownerId, data.id);
  }

  @MessagePattern({ cmd: 'update_supplier' })
  updateSupplier(@Payload() data: { ownerId: string; id: string; dto: import('./dto/supplier.dto.js').UpdateSupplierDto }) {
    return this.inventoryService.updateSupplier(data.ownerId, data.id, data.dto);
  }

  @MessagePattern({ cmd: 'delete_supplier' })
  deleteSupplier(@Payload() data: { ownerId: string; id: string }) {
    return this.inventoryService.deleteSupplier(data.ownerId, data.id);
  }

  // --- Purchases ---

  @MessagePattern({ cmd: 'create_purchase' })
  createPurchase(@Payload() data: { ownerId: string; dto: import('./dto/purchase.dto.js').CreatePurchaseDto }) {
    return this.inventoryService.createPurchase(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_purchases' })
  getPurchases(@Payload() data: { ownerId: string }) {
    return this.inventoryService.getPurchases(data.ownerId);
  }

  @MessagePattern({ cmd: 'get_purchase_by_id' })
  getPurchaseById(@Payload() data: { ownerId: string; id: string }) {
    return this.inventoryService.getPurchaseById(data.ownerId, data.id);
  }

  // --- Recipes ---

  @MessagePattern({ cmd: 'create_recipe' })
  createRecipe(@Payload() data: { ownerId: string; dto: import('./dto/recipe.dto.js').CreateRecipeDto }) {
    return this.inventoryService.createRecipe(data.ownerId, data.dto);
  }

  @MessagePattern({ cmd: 'get_recipe_by_menu_item_id' })
  getRecipeByMenuItemId(@Payload() data: { ownerId: string; menuItemId: string }) {
    return this.inventoryService.getRecipeByMenuItemId(data.ownerId, data.menuItemId);
  }

  // --- Analytics ---

  @MessagePattern({ cmd: 'get_low_stock_alerts' })
  getLowStockAlerts(@Payload() data: { ownerId: string }) {
    return this.inventoryService.getLowStockAlerts(data.ownerId);
  }

  @MessagePattern({ cmd: 'get_inventory_analytics' })
  getInventoryAnalytics(@Payload() data: { ownerId: string }) {
    return this.inventoryService.getInventoryAnalytics(data.ownerId);
  }
}
