import { describe, it, beforeEach, expect, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;
  let restaurantClient: ClientProxy;
  let menuClient: ClientProxy;
  let inventoryRmqClient: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: vi.fn(),
              findMany: vi.fn(),
              count: vi.fn(),
              findUnique: vi.fn().mockResolvedValue(null),
            },
          },
        },
        {
          provide: 'RESTAURANT_SERVICE',
          useValue: {
            send: vi.fn().mockReturnValue(of({ outlets: [{ id: 'outlet-1' }] })),
          },
        },
        {
          provide: 'MENU_SERVICE',
          useValue: {
            send: vi.fn().mockReturnValue(of({ data: [{ items: [{ name: 'Pizza' }] }] })),
          },
        },
        {
          provide: 'INVENTORY_RMQ',
          useValue: {
            emit: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    restaurantClient = module.get<ClientProxy>('RESTAURANT_SERVICE');
    menuClient = module.get<ClientProxy>('MENU_SERVICE');
    inventoryRmqClient = module.get<ClientProxy>('INVENTORY_RMQ');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an order successfully', async () => {
    const mockDto = {
      source: 'DINE_IN',
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      subtotal: 100,
      totalAmount: 100,
      items: [
        {
          itemName: 'Pizza',
          qty: 1,
          price: 100,
          total: 100,
        },
      ],
    } as any;

    const createSpy = vi.spyOn(prisma.order, 'create').mockResolvedValue({ id: 'order-1' } as any);

    const result = await service.createOrder('owner-1', mockDto);

    expect(result).toEqual({ id: 'order-1' });
    expect(createSpy).toHaveBeenCalled();
  });

  it('should throw BadRequestException if menu item does not exist', async () => {
    const mockDto = {
      subtotal: 100,
      totalAmount: 100,
      items: [
        {
          itemName: 'Burger', // Not in mocked menu
          qty: 1,
          price: 100,
          total: 100,
        },
      ],
    } as any;

    await expect(service.createOrder('owner-1', mockDto)).rejects.toThrow(BadRequestException);
  });
});
