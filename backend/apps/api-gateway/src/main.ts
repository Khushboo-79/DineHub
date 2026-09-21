import { NestFactory } from '@nestjs/core';
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
}
await bootstrap();
