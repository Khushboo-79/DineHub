import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  async createTax(restaurantId: string, dto: any) {
    return this.prisma.tax.create({
      data: {
        restaurantId,
        name: dto.name,
        rate: dto.rate,
        type: dto.type,
      },
    });
  }

  async getTaxes(restaurantId: string) {
    return this.prisma.tax.findMany({
      where: { restaurantId, isActive: true },
    });
  }

  async createDiscount(restaurantId: string, dto: any) {
    return this.prisma.discount.create({
      data: {
        restaurantId,
        name: dto.name,
        value: dto.value,
        type: dto.type,
        minOrderValue: dto.minOrderValue,
      },
    });
  }

  async getDiscounts(restaurantId: string) {
    return this.prisma.discount.findMany({
      where: { restaurantId, isActive: true },
    });
  }
}
