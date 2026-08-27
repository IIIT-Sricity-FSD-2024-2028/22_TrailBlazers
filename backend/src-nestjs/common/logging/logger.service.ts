import { Injectable, LoggerService as NestLogger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NestLoggerService implements NestLogger {
  private readonly appLogFile: string;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    this.appLogFile = path.join(logsDir, 'application.log');
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

  private appendLog(level: string, message: any, context?: string) {
    const timestamp = this.getISTTimestamp();
    const ctxString = context ? ` [${context}]` : '';
    const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
    const logLine = `${timestamp} | ${level.toUpperCase().padEnd(5)} |${ctxString} ${formattedMessage}\n`;

    // Console output for development visibility
    console.log(logLine.trim());

    // File persistence
    try {
      fs.appendFileSync(this.appLogFile, logLine, 'utf8');
    } catch (err) {
      console.error('Failed to write to application.log:', err);
    }
  }

  log(message: any, context?: string) {
    this.appendLog('INFO', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    const fullMsg = trace ? `${message}\nTrace: ${trace}` : message;
    this.appendLog('ERROR', fullMsg, context);
  }

  warn(message: any, context?: string) {
    this.appendLog('WARN', message, context);
  }

  debug?(message: any, context?: string) {
    this.appendLog('DEBUG', message, context);
  }

  verbose?(message: any, context?: string) {
    this.appendLog('VERBOSE', message, context);
  }
}
