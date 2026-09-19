import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AuthModule } from './auth.module.js';

async function bootstrap() {
  const logger = new Logger('AuthServiceBootstrap');
  const rmqUrl = process.env.RABBITMQ_URL;

  let microserviceOptions: MicroserviceOptions;

  if (rmqUrl) {
    microserviceOptions = {
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: process.env.AUTH_QUEUE || 'auth_queue',
        queueOptions: {
          durable: true,
        },
      },
    };
    logger.log(`Initializing Auth Microservice with RabbitMQ on ${rmqUrl}`);
  } else {
    const host = process.env.AUTH_SERVICE_HOST || '127.0.0.1';
    const port = Number(process.env.AUTH_SERVICE_PORT) || 3002;
    microserviceOptions = {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    };
    logger.log(`Initializing Auth Microservice with TCP on ${host}:${port}`);
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    microserviceOptions,
  );

  await app.listen();
  logger.log('✅ Auth Microservice is listening');
}

await bootstrap();
