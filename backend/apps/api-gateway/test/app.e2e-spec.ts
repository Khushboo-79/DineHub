import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiGatewayModule } from './../src/api-gateway.module.js';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('ApiGatewayController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    })
      .overrideProvider('AUTH_SERVICE')
      .useValue({
        send: vi.fn().mockImplementation((pattern) => {
          if (pattern.cmd === 'validate_jwt') {
            return of({ valid: true, user: { sub: 'owner-1', role: 'ADMIN' } });
          }
          return of({});
        }),
      })
      .overrideProvider('MENU_SERVICE')
      .useValue({
        send: vi.fn().mockImplementation((pattern) => {
          if (pattern.cmd === 'get_menu') {
            return of({ data: [{ name: 'Pizza Category', items: [] }], meta: { total: 1 } });
          }
          return of({});
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  it('/menu (GET) should require authentication', () => {
    return request(app.getHttpServer())
      .get('/menu')
      .expect(401);
  });

  it('/menu (GET) should return menu if authenticated as ADMIN', () => {
    return request(app.getHttpServer())
      .get('/menu?page=1&limit=10')
      .set('Authorization', 'Bearer valid-token')
      .expect(200)
      .expect((res) => {
        expect(res.body.data[0].name).toBe('Pizza Category');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
