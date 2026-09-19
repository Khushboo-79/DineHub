import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { describe, vi, beforeEach, it, expect } from 'vitest';

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: PrismaService,
          useValue: {
            restaurant: { findUnique: vi.fn() },
            menuCategory: { create: vi.fn(), findMany: vi.fn() },
            menuItem: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
