import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrdersModule } from './orders.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3006,
      },
    },
  );
  await app.listen();
}
await bootstrap();
