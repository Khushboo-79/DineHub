import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { MenuModule } from './menu.module.js';
import { HttpToRpcExceptionFilter } from './filters/http-to-rpc.filter.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(MenuModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3004 },
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpToRpcExceptionFilter());
  
  await app.listen();
}
await bootstrap();
