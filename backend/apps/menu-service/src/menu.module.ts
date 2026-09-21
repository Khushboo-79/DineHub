import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
          },
          ttl: 60 * 1000, // 1 minute default TTL
        }),
      }),
    }),
    PrismaModule,
    ClientsModule.register([
      {
        name: 'RESTAURANT_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3002 },
      },
    ]),
  ],
  controllers: [MenuController],
  providers: [MenuService]
})
export class MenuModule {}
