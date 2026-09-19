import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { InventoryModule } from './inventory.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    InventoryModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3005,
      },
    },
  );
  await app.listen();
}
await bootstrap();
