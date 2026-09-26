import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(HttpException)
export class MicroserviceExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    // In a microservice, we must return an RpcException or an Observable that emits an error
    return throwError(() => new RpcException({
      statusCode: status,
      message: typeof response === 'string' ? response : (response as any).message || response,
    }));
  }
}
