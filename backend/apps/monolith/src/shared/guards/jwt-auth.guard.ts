import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // In a microservice architecture, the API gateway validates the JWT
    // and passes the user information via headers (e.g., x-user-id).
    // For now, if x-user-id is present, we mock the user object.
    const userId = request.headers['x-user-id'];
    
    if (!userId) {
      // For local testing of monolith directly, we can just allow it or require it.
      // throw new UnauthorizedException('Missing x-user-id header');
      request.user = { userId: 'test-user-id' };
      return true;
    }

    request.user = { userId };
    return true;
  }
}
