import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async createCustomer(ownerId: string, dto: any) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new BadRequestException('Restaurant not found');

    // Check if phone already exists for this restaurant
    const existing = await this.prisma.customer.findUnique({
      where: {
        restaurantId_phone: {
          restaurantId: restaurant.id,
          phone: dto.phone,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Customer with this phone number already exists');
    }

    return this.prisma.customer.create({
      data: {
        restaurantId: restaurant.id,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        loyaltyPoints: dto.loyaltyPoints || 0,
      },
    });
  }

  async getCustomers(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new BadRequestException('Restaurant not found');

    return this.prisma.customer.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { visitsCount: 'desc' },
    });
  }

  async getCustomerByPhone(ownerId: string, phone: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new BadRequestException('Restaurant not found');

    const customer = await this.prisma.customer.findUnique({
      where: {
        restaurantId_phone: {
          restaurantId: restaurant.id,
          phone,
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateLoyaltyPoints(ownerId: string, customerId: string, points: number) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { ownerId } });
    if (!restaurant) throw new BadRequestException('Restaurant not found');

    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.restaurantId !== restaurant.id) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
    });
  }
}
