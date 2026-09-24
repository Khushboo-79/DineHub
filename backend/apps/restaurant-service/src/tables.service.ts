import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async createZone(outletId: string, name: string, description?: string) {
    return this.prisma.zone.create({
      data: {
        outletId,
        name,
        description,
      },
    });
  }

  async createTable(zoneId: string, name: string, capacity: number) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new BadRequestException('Zone not found');

    return this.prisma.table.create({
      data: {
        zoneId,
        name,
        capacity,
        status: 'AVAILABLE',
      },
    });
  }

  async getLiveStatus(outletId: string) {
    // Return all zones for the outlet with their nested tables and current status
    return this.prisma.zone.findMany({
      where: { outletId },
      include: {
        tables: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async createReservation(outletId: string, dto: any) {
    return this.prisma.reservation.create({
      data: {
        outletId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        guestsCount: dto.guestsCount,
        reservationTime: new Date(dto.reservationTime),
        specialRequests: dto.specialRequests,
        status: 'PENDING',
      },
    });
  }

  async assignTable(tableId: string, status: import('@prisma/client/restaurant/index.js').TableStatus) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new BadRequestException('Table not found');

    return this.prisma.table.update({
      where: { id: tableId },
      data: { status },
    });
  }
}
