import {
  Module,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import {
  ClientsModule,
  Transport,
  ClientProviderOptions,
} from '@nestjs/microservices';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ApiGatewayController } from './api-gateway.controller.js';
import { ApiGatewayService } from './api-gateway.service.js';
import { LoggingMiddleware } from './middleware/logging.middleware.js';
import { HttpProxyService } from './services/http-proxy.service.js';
import {
  GatewayRestaurantsController,
  GatewayMenuController,
  GatewayOrdersController,
  GatewayInventoryController,
} from './controllers/gateway-services.controller.js';

function getAuthServiceMicroserviceConfig(): ClientProviderOptions {
  const rmqUrl = process.env.RABBITMQ_URL;
  if (rmqUrl) {
    return {
      name: 'AUTH_SERVICE',
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: process.env.AUTH_QUEUE || 'auth_queue',
        queueOptions: {
          durable: true,
        },
      },
    };
  }

  // Fallback to TCP if RABBITMQ_URL is not set
  return {
    name: 'AUTH_SERVICE',
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST || '127.0.0.1',
      port: Number(process.env.AUTH_SERVICE_PORT) || 3002,
    },
  };
}

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute general limit
      },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dinehub_jwt_super_secret_dev_key_2026',
    }),
    ClientsModule.register([getAuthServiceMicroserviceConfig()]),
  ],
  controllers: [
    ApiGatewayController,
    GatewayRestaurantsController,
    GatewayMenuController,
    GatewayOrdersController,
    GatewayInventoryController,
  ],
  providers: [
    ApiGatewayService,
    HttpProxyService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
