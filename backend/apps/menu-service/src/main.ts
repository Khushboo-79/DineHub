import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { MenuModule } from './menu.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(MenuModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3004 },
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  
  await app.listen();
}
await bootstrap();
