import { MicroserviceExceptionFilter } from '../../../libs/shared/filters/microservice-exception.filter.js';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { OrdersModule } from './orders.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrdersModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3006 },
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  

  app.useGlobalFilters(new MicroserviceExceptionFilter());
  
  await app.listen();
}
await bootstrap();

