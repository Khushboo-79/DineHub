import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch()
export class HttpToRpcExceptionFilter implements ExceptionFilter {
  catch(exception: any) {
    if (exception instanceof HttpException) {
      return throwError(() => new RpcException({
        statusCode: exception.getStatus(),
        message: (exception.getResponse() as any).message || exception.message,
      }));
    }

    // Handle Prisma errors like foreign key constraints gracefully
    if (exception.code === 'P2003') {
      return throwError(() => new RpcException({
        statusCode: 400,
        message: 'Invalid reference: The related record does not exist (Foreign key constraint violated).',
      }));
    }

    return throwError(() => new RpcException({
      statusCode: 500,
      message: exception.message || 'Internal server error',
    }));
  }
}
