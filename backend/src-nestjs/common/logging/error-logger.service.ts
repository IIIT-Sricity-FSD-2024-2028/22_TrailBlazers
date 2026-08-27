import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ErrorLoggerService {
  private readonly errorLogFile: string;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    this.errorLogFile = path.join(logsDir, 'error.log');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private getISTTimestamp(): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    const formatter = new Intl.DateTimeFormat('en-IN', options);
    const parts = formatter.formatToParts(new Date());

    const d = parts.find((p) => p.type === 'day')?.value || '17';
    const m = parts.find((p) => p.type === 'month')?.value || 'Aug';
    const y = parts.find((p) => p.type === 'year')?.value || '2026';
    const hour = parts.find((p) => p.type === 'hour')?.value || '05';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const second = parts.find((p) => p.type === 'second')?.value || '00';
    const period = (parts.find((p) => p.type === 'dayPeriod')?.value || 'PM').toUpperCase();

    return `${d}-${m}-${y} ${hour}:${minute}:${second} ${period} IST`;
  }

  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return text;
    return text.replace(
      /(password|token|jwt|authorization|secret|apikey)=([^\s&|]+)/gi,
      '$1=[REDACTED]',
    );
  }

  logError(params: {
    category?: string;
    level?: string;
    message?: string;
    statusCode?: number;
    route?: string;
    req?: any;
    error?: any;
    stack?: string;
    details?: string;
  }) {
    try {
      const timestamp = this.getISTTimestamp();
      const level = (params.level || 'ERROR').toUpperCase();
      const category = (params.category || 'APPLICATION').toUpperCase();
      const req = params.req;
      const targetRoute =
        params.route || (req ? `${req.method} ${req.originalUrl || req.url}` : 'N/A');
      const statusCode = params.statusCode || 500;
      const requestId = req?.id || req?.requestId || 'N/A';
      const user = req?.user;
      const userId = user?.id || 'UNKNOWN';
      const userName = user?.name || 'N/A';
      const userRole = user?.role || 'N/A';
      const userDept = user?.department || '-';
      const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';

      const errMessage = this.sanitizeText(
        params.error?.message || (typeof params.error === 'string' ? params.error : params.message || 'An error occurred'),
      );
      const errStack = this.sanitizeText(params.stack || params.error?.stack || '');
      const errDetails = this.sanitizeText(params.details || params.error?.code || '');

      let entry = `==================================================\n`;
      entry += `TIMESTAMP: ${timestamp}\n`;
      entry += `LEVEL: ${level}\n`;
      entry += `CATEGORY: ${category}\n`;
      entry += `ROUTE: ${targetRoute}\n`;
      entry += `STATUS_CODE: ${statusCode}\n`;
      entry += `REQUEST_ID: ${requestId}\n`;
      entry += `USER_ID: ${userId}\n`;
      if (userId !== 'UNKNOWN') {
        entry += `USER: ${userName}\n`;
        entry += `ROLE: ${userRole}\n`;
        entry += `DEPARTMENT: ${userDept}\n`;
      }
      entry += `IP: ${ip}\n`;
      entry += `ERROR: ${errMessage}\n`;
      if (errDetails) {
        entry += `DETAILS: ${errDetails}\n`;
      }
      if (errStack) {
        entry += `STACK_TRACE:\n${errStack}\n`;
      }
      entry += `==================================================\n\n`;

      fs.appendFileSync(this.errorLogFile, entry, 'utf8');
    } catch (e) {
      console.error('Error writing to error.log:', e);
    }
  }
}
