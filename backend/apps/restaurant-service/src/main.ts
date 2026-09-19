import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RestaurantsModule } from './restaurants.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    RestaurantsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3003,
      },
    },
  );
  await app.listen();
}
await bootstrap();
