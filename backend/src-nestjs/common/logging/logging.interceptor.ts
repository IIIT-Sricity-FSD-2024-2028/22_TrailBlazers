import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NestLoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: NestLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const res = context.switchToHttp().getResponse();
          const statusCode = res.statusCode;
          this.logger.log(
            `${method} ${url} ${statusCode} +${duration}ms`,
            'HTTP',
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const status = error.status || error.statusCode || 500;
          this.logger.error(
            `${method} ${url} ${status} +${duration}ms - Error: ${error.message}`,
            error.stack,
            'HTTP_ERROR',
          );
        },
      }),
    );
  }
}
