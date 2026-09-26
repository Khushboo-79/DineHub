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

    console.error(`[GlobalExceptionFilter] Caught exception:`, exception);

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof RpcException) {
      const error = exception.getError();
      status = (error as any).statusCode || HttpStatus.BAD_REQUEST;
      message = (error as any).message || error;
    } else if (exception?.message) {
      // Handle generic errors that get passed from microservices as regular objects
      if (typeof exception.status === 'number' || typeof exception.statusCode === 'number') {
        status = exception.status || exception.statusCode;
        message = exception.message || exception.response;
      } else if (exception.response && typeof exception.response.statusCode === 'number') {
        status = exception.response.statusCode || HttpStatus.BAD_REQUEST;
        message = exception.response.message || exception.response;
      } else if (exception.error && typeof exception.error.statusCode === 'number') {
        status = exception.error.statusCode;
        message = exception.error.message || exception.message;
      } else if (exception.status === 'error') {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message || 'Internal server error';
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
