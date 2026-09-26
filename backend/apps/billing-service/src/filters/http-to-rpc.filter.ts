import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(HttpException)
export class HttpToRpcExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException) {
    return throwError(() => new RpcException({
      statusCode: exception.getStatus(),
      message: (exception.getResponse() as any).message || exception.message,
    }));
  }
}
