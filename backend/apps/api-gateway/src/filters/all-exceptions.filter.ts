import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message ?? res;
        errorDetails = (res as any).error;
      } else {
        message = res;
      }
    } else if (exception && typeof exception === 'object') {
      // Handle RPC Exception payload or Axios errors
      if (exception.status && typeof exception.status === 'number') {
        status = exception.status;
      } else if (exception.response?.status) {
        status = exception.response.status;
      }

      if (exception.response?.data) {
        message = exception.response.data.message || exception.response.data;
      } else if (exception.message) {
        message = exception.message;
      }
    }

    this.logger.error(
      `[${request?.method ?? 'UNKNOWN'}] ${request?.url ?? ''} -> Status: ${status} | Error: ${JSON.stringify(message)}`,
      exception?.stack,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url,
      message,
      ...(errorDetails ? { error: errorDetails } : {}),
    });
  }
}
