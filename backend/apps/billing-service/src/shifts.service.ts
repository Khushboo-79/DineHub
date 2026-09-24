import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async openShift(restaurantId: string, openedById: string, openingFloat: number) {
    // Check if there's already an OPEN shift for this restaurant
    const activeShift = await this.prisma.cashShift.findFirst({
      where: { restaurantId, status: 'OPEN' },
    });

    if (activeShift) {
      throw new BadRequestException('An active shift is already open. Please close it first.');
    }

    return this.prisma.cashShift.create({
      data: {
        restaurantId,
        openedById,
        openingFloat,
      },
    });
  }

  async cashDrop(shiftId: string, amount: number, reason: string, type: string, performedById: string) {
    const shift = await this.prisma.cashShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new BadRequestException('Shift not found');
    if (shift.status === 'CLOSED') throw new BadRequestException('Cannot modify a closed shift');

    const drop = await this.prisma.cashDrop.create({
      data: {
        shiftId,
        amount,
        reason,
        type, // DROP, PAYIN, PAYOUT
        performedById,
      },
    });

    return { message: 'Cash drop recorded', drop };
  }

  async closeShift(shiftId: string, closedById: string, actualCash: number) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { cashDrops: true },
    });

    if (!shift) throw new BadRequestException('Shift not found');
    if (shift.status === 'CLOSED') throw new BadRequestException('Shift is already closed');

    // Calculate Expected Cash
    // Expected Cash = Opening Float
    // + (Cash sales during this shift) - We would normally fetch this from Invoices!
    
    // For MVP, let's fetch total cash payments made since this shift opened
    const cashPayments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        method: 'CASH',
        status: 'SUCCESS',
        createdAt: { gte: shift.openedAt },
      },
    });

    const totalCashSales = cashPayments._sum.amount || 0;

    // Drops & Payouts logic
    const totalDrops = shift.cashDrops.filter(d => d.type === 'DROP').reduce((sum, d) => sum + d.amount, 0);
    const totalPayins = shift.cashDrops.filter(d => d.type === 'PAYIN').reduce((sum, d) => sum + d.amount, 0);
    const totalPayouts = shift.cashDrops.filter(d => d.type === 'PAYOUT').reduce((sum, d) => sum + d.amount, 0);

    const expectedCash = shift.openingFloat + totalCashSales + totalPayins - totalDrops - totalPayouts;
    const discrepancy = actualCash - expectedCash;

    return this.prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedById,
        closedAt: new Date(),
        expectedCash,
        actualCash,
        discrepancy,
      },
    });
  }

  async getShifts(restaurantId: string) {
    return this.prisma.cashShift.findMany({
      where: { restaurantId },
      orderBy: { openedAt: 'desc' },
    });
  }

  async getShiftReport(shiftId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { cashDrops: true },
    });

    if (!shift) throw new BadRequestException('Shift not found');

    const cashPayments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        method: 'CASH',
        status: 'SUCCESS',
        createdAt: {
          gte: shift.openedAt,
          lte: shift.closedAt || new Date(),
        },
      },
    });

    return {
      ...shift,
      totalCashSales: cashPayments._sum.amount || 0,
    };
  }
}
