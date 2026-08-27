import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorLoggerService } from '../logging/error-logger.service';
import { NestLoggerService } from '../logging/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly errorLogger: ErrorLoggerService,
    private readonly logger: NestLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred.';
    let customPayload: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resPayload: any = exception.getResponse();
      if (typeof resPayload === 'string') {
        message = resPayload;
      } else if (typeof resPayload === 'object' && resPayload !== null) {
        customPayload = { ...resPayload };
        if (Array.isArray(resPayload.message)) {
          message = resPayload.message.join('; ');
        } else {
          message = resPayload.error || resPayload.message || message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      status = (exception as any).statusCode || (exception as any).status || status;
    }

    const requestId = request.id || 'req_unknown';

    // Log to error.log
    this.errorLogger.logError({
      category: status >= 500 ? 'SERVER_ERROR' : 'API_ERROR',
      level: status >= 500 ? 'ERROR' : 'WARN',
      message,
      statusCode: status,
      req: request,
      error: exception,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Log to application.log
    this.logger.error(message, exception instanceof Error ? exception.stack : undefined, 'API_EXCEPTION');

    // Preserve original Express API error response contract & custom payload properties
    response.status(status).json({
      error: message,
      ...customPayload,
      requestId,
    });
  }
}
