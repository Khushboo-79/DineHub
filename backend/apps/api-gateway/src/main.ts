import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ApiGatewayModule } from './api-gateway.module.js';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

import { RpcExceptionFilter } from './rpc-exception.filter';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  // Security headers
  app.use(helmet());
  // Enable CORS (allow all origins by default)
  app.enableCors();
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  // Global throttler guard

  // Global RPC exception filter
  app.useGlobalFilters(new RpcExceptionFilter());
  await app.listen(process.env.port ?? 4000);
import { AllExceptionsFilter } from './filters/rpc-exception.filter.js';
import * as express from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  
  // Use Winston for global application logging
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Increase Payload Size limit to 50MB for Base64 Images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Apply Global Validation Pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true 
  }));

  // Apply Global Exception Filter to standardize errors
  app.useGlobalFilters(new AllExceptionsFilter());

  // Set default port to 3000 (standard for gateway)
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
