import { Module, Global } from '@nestjs/common';
import { NestLoggerService } from './logger.service';
import { ErrorLoggerService } from './error-logger.service';
import { AccessLoggerService } from './access-logger.service';
import { LogRotationService } from './log-rotation.service';

@Global()
@Module({
  providers: [NestLoggerService, ErrorLoggerService, AccessLoggerService, LogRotationService],
  exports: [NestLoggerService, ErrorLoggerService, AccessLoggerService, LogRotationService],
})
export class LoggingModule {}

