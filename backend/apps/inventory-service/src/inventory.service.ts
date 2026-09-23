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
    
    for (const orderItem of order.items) {
      if (!orderItem.menuItemId) continue;

      const recipe = await this.prisma.recipe.findFirst({
        where: { menuItemId: orderItem.menuItemId },
        include: { items: true },
      });
      
      if (recipe) {
        for (const recipeItem of recipe.items) {
          const deduction = recipeItem.quantity * orderItem.qty;
          await this.prisma.inventoryItem.update({
            where: { id: recipeItem.inventoryItemId },
            data: { currentStock: { decrement: deduction } },
          });
          console.log(`[RabbitMQ] Deducted ${deduction} from inventoryItem ${recipeItem.inventoryItemId} for ${orderItem.itemName}`);
        }
      } else {
        console.log(`[RabbitMQ] No recipe found for menuItemId ${orderItem.menuItemId}`);
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

  // --- Recipes ---

  async createRecipe(ownerId: string, dto: import('./dto/recipe.dto.js').CreateRecipeDto) {
    const restaurantId = await this.getRestaurantId(ownerId);

    // If recipe exists for this menuItemId, update it (by deleting old items and recreating)
    const existingRecipe = await this.prisma.recipe.findFirst({
      where: { menuItemId: dto.menuItemId, restaurantId }
    });

    if (existingRecipe) {
      return this.prisma.recipe.update({
        where: { id: existingRecipe.id },
        data: {
          items: {
            deleteMany: {},
            create: dto.items.map(item => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true }
      });
    }

    return this.prisma.recipe.create({
      data: {
        restaurantId,
        menuItemId: dto.menuItemId,
        items: {
          create: dto.items.map(item => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity
          }))
        }
      },
      include: { items: true }
    });
  }

  async getRecipeByMenuItemId(ownerId: string, menuItemId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    const recipe = await this.prisma.recipe.findFirst({
      where: { menuItemId, restaurantId },
      include: {
        items: {
          include: { inventoryItem: true }
        }
      }
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  // --- Analytics ---

  async getLowStockAlerts(ownerId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    // Find items where currentStock <= reorderLevel or currentStock == 0
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        restaurantId,
      }
    });

    const alerts = items
      .filter(item => item.currentStock <= 0 || (item.reorderLevel !== null && item.currentStock <= item.reorderLevel))
      .map(item => ({
        name: item.name,
        stockLeft: `${item.currentStock} ${item.unit} left`,
        status: item.currentStock <= 0 ? 'Out of Stock' : 'Low Stock',
        image: item.image
      }))
      .slice(0, 4); // Only top 4 for dashboard

    return alerts;
  }

  async getInventoryAnalytics(ownerId: string) {
    const restaurantId = await this.getRestaurantId(ownerId);
    
    const items = await this.prisma.inventoryItem.findMany({
      where: { restaurantId }
    });

    let totalItems = items.length;
    let lowStock = 0;
    let outOfStock = 0;
    let inventoryValue = 0;

    items.forEach(item => {
      if (item.currentStock <= 0) {
        outOfStock++;
      } else if (item.reorderLevel !== null && item.currentStock <= item.reorderLevel) {
        lowStock++;
      }

      if (item.currentStock > 0) {
        inventoryValue += (item.currentStock * item.purchasePrice);
      }
    });

    return {
      totalItems,
      lowStock,
      outOfStock,
      inventoryValue: Math.round(inventoryValue)
    };
  }
}
