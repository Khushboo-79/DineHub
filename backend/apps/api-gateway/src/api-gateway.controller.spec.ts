import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayController } from './api-gateway.controller';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ApiGatewayController', () => {
  let apiGatewayController: ApiGatewayController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiGatewayController],
      providers: [
        {
          provide: 'AUTH_SERVICE',
          useValue: {
            send: vi.fn(),
            emit: vi.fn(),
          },
        },
      ],
    }).compile();

    apiGatewayController = app.get<ApiGatewayController>(ApiGatewayController);
  });

  it('should be defined', () => {
    expect(apiGatewayController).toBeDefined();
  });
});
