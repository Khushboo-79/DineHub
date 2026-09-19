import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ApiGatewayModule } from './api-gateway.module.js';
import { AllExceptionsFilter } from './filters/all-exceptions.filter.js';

async function bootstrap() {
  const logger = new Logger('ApiGatewayBootstrap');
  const app = await NestFactory.create(ApiGatewayModule);

  // 1. Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // 2. Production CORS setup
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true;

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-correlation-id',
      'x-user-id',
      'x-restaurant-id',
    ],
  });

  // 3. Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 4. Global RPC & HTTP exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. Swagger / OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('DineHub API Gateway')
    .setDescription(
      'Production API Gateway for DineHub restaurant management platform. Unified entry point for Auth, Restaurants, Menus, Orders, and Inventory.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your Bearer token received from /auth/verify-otp',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'DineHub API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? process.env.GATEWAY_PORT ?? 4000;
  await app.listen(port);
  logger.log(`🚀 API Gateway running on http://localhost:${port}`);
  logger.log(`📚 Interactive Swagger API Docs available at http://localhost:${port}/docs`);
}

await bootstrap();
