import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = (exception as any).getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = (exception as any).getError?.() ?? exception.message;
    response.status(status).json({
      statusCode: status,
      error: message,
    });
  }
}
