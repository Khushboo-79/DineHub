import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApiGatewayController } from './api-gateway.controller.js';
import { ApiGatewayService } from './api-gateway.service.js';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: 10 },
import { AppWebSocketGateway } from './websockets/websockets.gateway.js';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('ApiGateway', {
              colors: true,
              appName: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/api-gateway-error.log',
          level: 'error',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        new winston.transports.File({
          filename: 'logs/api-gateway-combined.log',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3001 },
      },
      {
        name: 'RESTAURANT_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3002 },
      },
      {
        name: 'MENU_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3004 },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3005 },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3006 },
      },
      {
        name: 'BILLING_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3007 },
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
  providers: [
    ApiGatewayService, 
    AppWebSocketGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiGatewayModule {}
