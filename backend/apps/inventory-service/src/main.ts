import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { InventoryModule } from './inventory.module.js';
import { HttpToRpcExceptionFilter } from './filters/http-to-rpc.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);

  // TCP Microservice (existing)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3005 },
  }, { inheritAppConfig: true });

  // RabbitMQ Microservice (new)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
      queue: 'inventory_queue',
      queueOptions: {
        durable: true,
      },
    },
  }, { inheritAppConfig: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpToRpcExceptionFilter());
  
  await app.startAllMicroservices();
}
await bootstrap();
