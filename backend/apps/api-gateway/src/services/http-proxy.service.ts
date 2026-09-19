import {
  Injectable,
  BadGatewayException,
  HttpException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, Method } from 'axios';

@Injectable()
export class HttpProxyService {
  private getMonolithBaseUrl(): string {
    return process.env.MONOLITH_URL || 'http://127.0.0.1:3000';
  }

  async forward(options: {
    method: Method;
    path: string;
    data?: any;
    params?: any;
    headers?: Record<string, any>;
  }) {
    const targetUrl = `${this.getMonolithBaseUrl()}${options.path}`;

    // Filter headers to avoid conflicting host/content-length
    const cleanHeaders: Record<string, any> = {};
    if (options.headers) {
      const allowedHeaders = [
        'authorization',
        'content-type',
        'x-user-id',
        'x-user-role',
        'x-restaurant-id',
        'x-correlation-id',
      ];
      for (const [key, value] of Object.entries(options.headers)) {
        if (allowedHeaders.includes(key.toLowerCase()) && value !== undefined) {
          cleanHeaders[key] = value;
        }
      }
    }

    const config: AxiosRequestConfig = {
      method: options.method,
      url: targetUrl,
      data: options.data,
      params: options.params,
      headers: cleanHeaders,
      validateStatus: () => true, // capture all status codes directly
      timeout: 10000,
    };

    try {
      const response = await axios(config);
      if (response.status >= 400) {
        throw new HttpException(
          response.data || 'Service error',
          response.status,
        );
      }
      return response.data;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadGatewayException(
        `Failed to reach downstream service: ${error?.message || 'Downstream unreachable'}`,
      );
    }
  }
}
