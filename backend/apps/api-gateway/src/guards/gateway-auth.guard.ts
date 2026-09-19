import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthenticatedUser {
  userId: string;
  mobileNumber?: string;
  role?: string;
  restaurantId?: string;
}

@Injectable()
export class GatewayAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dinehub_jwt_super_secret_dev_key_2026',
      });

      const user: AuthenticatedUser = {
        userId: payload.sub || payload.userId || payload.id,
        mobileNumber: payload.mobileNumber,
        role: payload.role,
        restaurantId: payload.restaurantId,
      };

      request.user = user;
      request.headers['x-user-id'] = user.userId;
      if (user.role) request.headers['x-user-role'] = user.role;
      if (user.restaurantId) request.headers['x-restaurant-id'] = user.restaurantId;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
