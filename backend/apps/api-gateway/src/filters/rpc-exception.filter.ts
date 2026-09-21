import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof RpcException) {
      const error = exception.getError();
      status = (error as any).statusCode || HttpStatus.BAD_REQUEST;
      message = (error as any).message || error;
    } else if (exception?.message) {
      // Handle generic errors that get passed from microservices as regular objects
      if (exception.status || exception.statusCode) {
        status = exception.status || exception.statusCode;
        message = exception.message || exception.response;
      } else if (exception.response) {
        status = exception.response.statusCode || HttpStatus.BAD_REQUEST;
        message = exception.response.message || exception.response;
      }
    }

    if (typeof message === 'object' && message !== null) {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(message as object),
      });
    } else {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
