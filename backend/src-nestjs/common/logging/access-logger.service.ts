import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AccessLoggerService {
  private readonly accessLogFile: string;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    this.accessLogFile = path.join(logsDir, 'user_access.log');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  getISTTimestamp(): string {
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

  private appendAccessRecord(entryText: string) {
    try {
      fs.appendFileSync(
        this.accessLogFile,
        entryText.trim() + '\n--------------------------------------------------\n\n',
        'utf8',
      );
    } catch (err) {
      console.error('Error writing to user_access.log:', err);
    }
  }

  recordLoginSuccess({ user, req }: { user: any; req?: any }) {
    if (!user) return;
    const timestamp = this.getISTTimestamp();
    const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'Unknown Browser';

    const record = `
${timestamp}
USER_ID: ${user.id}
NAME: ${user.name || 'N/A'}
EMAIL: ${user.email}
ROLE: ${user.role}
DEPARTMENT: ${user.department || '-'}
IP: ${ip}
USER_AGENT: ${userAgent}
STATUS: LOGIN_SUCCESS
    `;
    this.appendAccessRecord(record);
  }

  recordLoginFailure({ email, reason, req }: { email?: string; reason?: string; req?: any }) {
    const timestamp = this.getISTTimestamp();
    const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'Unknown Browser';

    const record = `
${timestamp}
EMAIL: ${email || 'N/A'}
STATUS: LOGIN_FAILED
REASON: ${reason || 'INVALID_CREDENTIALS'}
IP: ${ip}
USER_AGENT: ${userAgent}
    `;
    this.appendAccessRecord(record);
  }

  recordLogout({ user, req }: { user: any; req?: any }) {
    if (!user) return;
    const timestamp = this.getISTTimestamp();
    const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'Unknown Browser';

    const record = `
${timestamp}
USER_ID: ${user.id}
NAME: ${user.name || 'N/A'}
EMAIL: ${user.email}
ROLE: ${user.role}
DEPARTMENT: ${user.department || '-'}
IP: ${ip}
USER_AGENT: ${userAgent}
STATUS: LOGOUT
    `;
    this.appendAccessRecord(record);
  }

  recordUserCreated({ user, createdBy, req }: { user: any; createdBy?: string; req?: any }) {
    if (!user) return;
    const timestamp = this.getISTTimestamp();

    const record = `
${timestamp}
ACTION: USER_CREATED
USER_ID: ${user.id}
NAME: ${user.name || 'N/A'}
EMAIL: ${user.email}
ROLE: ${user.role}
DEPARTMENT: ${user.department || '-'}
CREATED_BY: ${createdBy || 'SELF_REGISTRATION'}
STATUS: USER_CREATED
    `;
    this.appendAccessRecord(record);
  }

  getRecentAccessEntries(limit: number = 30): Record<string, string>[] {
    if (!fs.existsSync(this.accessLogFile)) return [];
    try {
      const fileContent = fs.readFileSync(this.accessLogFile, 'utf8');
      const blocks = fileContent
        .split('--------------------------------------------------')
        .filter((b) => b.trim() !== '');

      const parsed = blocks.map((block) => {
        const lines = block
          .trim()
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const timestamp = lines[0] || '';
        const entry: Record<string, string> = { timestamp };

        lines.slice(1).forEach((line) => {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            const key = line.substring(0, colonIdx).trim().toLowerCase();
            const val = line.substring(colonIdx + 1).trim();
            entry[key] = val;
          }
        });

        return entry;
      });

      return parsed.reverse().slice(0, limit);
    } catch (err) {
      console.error('Error reading user access logs:', err);
      return [];
    }
  }
}
