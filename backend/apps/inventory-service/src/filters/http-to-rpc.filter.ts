import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch()
export class HttpToRpcExceptionFilter implements ExceptionFilter {
  catch(exception: any) {
    console.error('[InventoryService] Caught Exception:', exception);
    
    if (exception instanceof HttpException) {
      return throwError(() => new RpcException({
        statusCode: exception.getStatus(),
        message: (exception.getResponse() as any).message || exception.message,
      }));
    }

    return throwError(() => new RpcException({
      statusCode: 500,
      message: exception.message || 'Internal server error',
    }));
  }
}
