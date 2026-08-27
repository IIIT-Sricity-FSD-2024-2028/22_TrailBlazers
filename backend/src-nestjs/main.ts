import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { NestLoggerService } from './common/logging/logger.service';
import { ErrorLoggerService } from './common/logging/error-logger.service';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(NestLoggerService);
  const errorLogger = app.get(ErrorLoggerService);

  // Set custom NestLoggerService as primary logger
  app.useLogger(logger);

  // Phase 9D: Apply Helmet HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disables strict CSP so Swagger UI and frontend assets render cleanly
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Phase 9E: Serve uploaded assets safely from backend/uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Set global API prefix matching existing frontend contracts (/api/*)
  app.setGlobalPrefix('api');

  // Phase 9D: Enable CORS matching development & evaluation client origins
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-role', 'x-user-role', 'x-request-id'],
  });

  // Task 5: Global Validation Pipe infrastructure
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Task 7: Global HTTP Request Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Task 6: Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter(errorLogger, logger));

  // Phase 9A & 9B: Swagger Open API Documentation setup with x-role header RBAC
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wavevents FDFED Review-4 API')
    .setDescription(
      'Official NestJS backend REST API documentation for Wavevents Event Management & Post-Event Analytics Application.',
    )
    .setVersion('1.0')
    .addGlobalParameters({
      name: 'x-role',
      in: 'header',
      required: false,
      description:
        'Role used for evaluation-time RBAC authorization. Authentication is not required when this header is supplied.',
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Bearer token for authenticated mode',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Task 9: Separate NestJS development port (5001) to NOT disturb Express (5000)
  const nestPort = configService.get<number>('nestPort') || 5001;
  const expressPort = configService.get<number>('expressPort') || 5000;

  await app.listen(nestPort);

  logger.log(
    `Wavevents NestJS Migration Server started on http://localhost:${nestPort}/api`,
    'NEST_BOOTSTRAP',
  );
  logger.log(
    `Swagger API Documentation available on http://localhost:${nestPort}/api/docs`,
    'NEST_BOOTSTRAP',
  );
  logger.log(
    `Express backend remains active on http://localhost:${expressPort}/api`,
    'NEST_BOOTSTRAP',
  );
}

bootstrap();
