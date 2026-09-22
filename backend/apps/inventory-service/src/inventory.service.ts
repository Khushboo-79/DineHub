import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from './prisma/prisma.service.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    @Inject('RESTAURANT_SERVICE') private restaurantClient: ClientProxy,
  ) {}

  private async getRestaurantId(ownerId: string) {
    try {
      const restaurant = await firstValueFrom(
        this.restaurantClient.send({ cmd: 'get_restaurant_by_owner' }, { ownerId })
      );
      if (!restaurant || !restaurant.id) {
        throw new NotFoundException('Restaurant not found for this user');
      }
      return restaurant.id;
    } catch (error) {
      throw new NotFoundException('Restaurant not found for this user');
    }
  }

  async create(ownerId: string, dto: CreateInventoryItemDto) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Convert string dates to Date objects if provided
    let dataToSave: any = { ...dto, restaurantId };
    if (dto.expiryDate) {
      dataToSave.expiryDate = new Date(dto.expiryDate);
    }

    return this.prisma.inventoryItem.create({
      data: dataToSave,
    });
  }

  async getInventory(ownerId: string, page: number = 1, limit: number = 10) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where: { restaurantId },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.inventoryItem.count({
        where: { restaurantId },
      })
    ]);

    // Calculate metrics for all items (not just this page)
    // Note: In a real app, this aggregation should be done in a separate query or cached
    const allItems = await this.prisma.inventoryItem.findMany({
      where: { restaurantId },
    });
    
    const totalItems = allItems.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inventoryValue = 0;

    allItems.forEach((item: any) => {
      inventoryValue += (item.currentStock * item.purchasePrice);

      if (item.currentStock <= 0) {
        outOfStockCount++;
      } else if (item.reorderLevel !== null && item.currentStock <= item.reorderLevel) {
        lowStockCount++;
      }
    });

    return {
      metrics: {
        totalItems,
        lowStockCount,
        outOfStockCount,
        inventoryValue
      },
      data: items,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / limit),
      }
    };
  }

  async findOne(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });
    if (!item) throw new NotFoundException('Inventory item not found or unauthorized');
    return item;
  }

  async update(ownerId: string, id: string, dto: UpdateInventoryItemDto) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Verify ownership
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });
    if (!item) throw new NotFoundException('Inventory item not found or unauthorized');

    let dataToSave: any = { ...dto };
    if (dto.expiryDate) {
      dataToSave.expiryDate = new Date(dto.expiryDate);
    }

    return this.prisma.inventoryItem.update({
      where: { id },
      data: dataToSave,
    });
  }

  async remove(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // Verify ownership
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, restaurantId },
    });
    if (!item) throw new NotFoundException('Inventory item not found or unauthorized');

    await this.prisma.inventoryItem.delete({
      where: { id },
    });

    return { message: 'Inventory item deleted successfully' };
  }

  async deductInventoryForOrder(order: any) {
    if (!order || !order.items || order.items.length === 0) return;
    
    // In a real application, you'd map order.items to inventory items.
    // For this demonstration, we'll try to find an inventory item with the same name.
    for (const orderItem of order.items) {
      const inventoryItem = await this.prisma.inventoryItem.findFirst({
        where: { name: orderItem.itemName },
      });
      
      if (inventoryItem) {
        const newStock = Math.max(0, inventoryItem.currentStock - orderItem.qty);
        await this.prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { currentStock: newStock },
        });
        console.log(`[RabbitMQ] Deducted ${orderItem.qty} from ${inventoryItem.name}. New Stock: ${newStock}`);
      }
    }
  }

  // --- Suppliers ---

  async createSupplier(ownerId: string, dto: import('./dto/supplier.dto.js').CreateSupplierDto) {
    const restaurantId = await this.getRestaurantId(ownerId);
    return this.prisma.supplier.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async getSuppliers(ownerId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    return this.prisma.supplier.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    });
  }

  async getSupplierById(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, restaurantId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async updateSupplier(ownerId: string, id: string, dto: import('./dto/supplier.dto.js').UpdateSupplierDto) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, restaurantId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSupplier(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, restaurantId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    await this.prisma.supplier.delete({
      where: { id },
    });
    return { message: 'Supplier deleted successfully' };
  }

  // --- Purchases ---

  async createPurchase(ownerId: string, dto: import('./dto/purchase.dto.js').CreatePurchaseDto) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    // Generate purchase ID, e.g., PUR-1024
    const count = await this.prisma.purchase.count();
    const purchaseId = `PUR-${1000 + count + 1}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          restaurantId,
          purchaseId,
          supplierId: dto.supplierId,
          invoiceNumber: dto.invoiceNumber,
          date: dto.date ? new Date(dto.date) : new Date(),
          totalAmount: dto.totalAmount,
          status: dto.status,
          items: {
            create: dto.items.map(item => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              rate: item.rate,
              tax: item.tax,
              total: item.total
            }))
          }
        },
        include: {
          items: true,
          supplier: true
        }
      });

      // 2. Update Inventory Stock
      for (const item of dto.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            currentStock: { increment: item.quantity },
            purchasePrice: item.rate // Update the purchase price to the latest rate
          }
        });
      }

      // 3. Update Supplier Financials
      let pendingIncrement = 0;
      if (dto.status === 'Pending') pendingIncrement = dto.totalAmount;
      // If partial, UI should theoretically send the amount paid, but since it's just 'Partial', we'll assume it's entirely pending for now or handled elsewhere. Let's assume full amount is pending if not paid.
      if (dto.status === 'Partial') pendingIncrement = dto.totalAmount; 

      await tx.supplier.update({
        where: { id: dto.supplierId },
        data: {
          totalPurchase: { increment: dto.totalAmount },
          pendingAmount: { increment: pendingIncrement }
        }
      });

      return purchase;
    });
  }

  async getPurchases(ownerId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    return this.prisma.purchase.findMany({
      where: { restaurantId },
      include: { supplier: true },
      orderBy: { date: 'desc' }
    });
  }

  async getPurchaseById(ownerId: string, id: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, restaurantId },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true }
        }
      }
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }
}
