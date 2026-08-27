import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly accessLogFile: string;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    this.accessLogFile = path.join(logsDir, 'access.log');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private sanitizeUrl(url: string): string {
    if (!url) return url;
    return url.replace(/(password|token|jwt|secret|apikey)=([^\s&]+)/gi, '$1=[REDACTED]');
  }

  use(req: Request & { id?: string; user?: any }, res: Response, next: NextFunction) {
    // Assign or propagate unique Request ID across logs
    if (!req.id) {
      req.id = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    }

    const startTime = Date.now();
    const method = req.method;
    const rawUrl = req.originalUrl || req.url;
    const url = this.sanitizeUrl(rawUrl);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const roleHeader = req.headers['x-role'] || req.headers['x-user-role'];
      const role = (roleHeader ? String(roleHeader).trim().toUpperCase() : (req.user?.role || 'ANONYMOUS'));
      const requestId = req.id;
      const timestamp = new Date().toISOString();

      const entry = `[${timestamp}] REQUEST_ID=${requestId} METHOD=${method} URL=${url} STATUS=${statusCode} DURATION=${duration}ms ROLE=${role}\n`;

      try {
        fs.appendFileSync(this.accessLogFile, entry, 'utf8');
      } catch (e) {
        console.error('Error writing to access.log:', e);
      }
    });

    next();
  }
}
