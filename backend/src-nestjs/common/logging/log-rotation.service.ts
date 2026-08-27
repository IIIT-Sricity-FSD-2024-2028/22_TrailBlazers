import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogRotationService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private readonly logsDir: string;
  private readonly logFilesToRotate = [
    'access.log',
    'application.log',
    'error.log',
    'user_access.log',
  ];

  constructor(private readonly configService?: ConfigService) {
    this.logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  onModuleInit() {
    const intervalMs = this.getRotationIntervalMs();
    const intervalMinutes = Math.round(intervalMs / 60000);

    console.log(
      `[LOG_ROTATION_INIT] LogRotationService scheduled. Interval: ${intervalMinutes} minute(s) (${intervalMs}ms)`,
    );

    // Start background periodic rotation timer
    this.timer = setInterval(() => {
      this.rotateLogs();
    }, intervalMs);

    // Unref timer so it does not block application process exit when shutting down
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[LOG_ROTATION_DESTROY] LogRotationService timer cleared.');
    }
  }

  /**
   * Reads rotation interval from env:
   * 1. LOG_ROTATION_INTERVAL_SECONDS (for rapid testing/evaluation if set)
   * 2. LOG_ROTATION_INTERVAL_MINUTES (default: 60 minutes)
   */
  private getRotationIntervalMs(): number {
    const secEnv =
      this.configService?.get<string>('LOG_ROTATION_INTERVAL_SECONDS') ||
      process.env.LOG_ROTATION_INTERVAL_SECONDS;

    if (secEnv) {
      const parsedSec = parseInt(secEnv, 10);
      if (!isNaN(parsedSec) && parsedSec > 0) {
        return parsedSec * 1000;
      }
    }

    const minEnv =
      this.configService?.get<string>('LOG_ROTATION_INTERVAL_MINUTES') ||
      process.env.LOG_ROTATION_INTERVAL_MINUTES;

    if (minEnv) {
      const parsedMin = parseInt(minEnv, 10);
      if (!isNaN(parsedMin) && parsedMin > 0) {
        return parsedMin * 60 * 1000;
      }
    }

    // Default: 60 minutes
    return 60 * 60 * 1000;
  }

  /**
   * Helper to format IST Date components safely for directory and file naming
   */
  private getISTDateParts(): { dateFolder: string; timeString: string } {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-CA', options); // YYYY-MM-DD
    const parts = formatter.formatToParts(now);

    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const day = parts.find((p) => p.type === 'day')?.value || '01';

    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const second = parts.find((p) => p.type === 'second')?.value || '00';

    const dateFolder = `${year}-${month}-${day}`;
    const timeString = `${hour}-${minute}-${second}`;

    return { dateFolder, timeString };
  }

  /**
   * Performs log rotation for all active log files safely.
   */
  public rotateLogs(): { success: boolean; rotatedFiles: string[] } {
    const rotatedFiles: string[] = [];

    try {
      const { dateFolder, timeString } = this.getISTDateParts();
      const archiveDir = path.join(this.logsDir, 'archive', dateFolder);

      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      for (const fileName of this.logFilesToRotate) {
        const activeFilePath = path.join(this.logsDir, fileName);

        if (!fs.existsSync(activeFilePath)) {
          // Recreate empty log file if missing
          fs.writeFileSync(activeFilePath, '', 'utf8');
          continue;
        }

        try {
          const stats = fs.statSync(activeFilePath);
          if (stats.size === 0) {
            // File is empty, skip archiving empty file
            continue;
          }

          const parsed = path.parse(fileName);
          const archiveFileName = `${parsed.name}-${timeString}${parsed.ext}`;
          const targetArchivePath = path.join(archiveDir, archiveFileName);

          // Robust Windows log rotation handling:
          // Read content or copy to archive, then truncate active file to 0 bytes
          // This prevents EBUSY / EPERM file locking issues on Windows Node.js file streams.
          fs.copyFileSync(activeFilePath, targetArchivePath);
          fs.writeFileSync(activeFilePath, '', 'utf8');

          rotatedFiles.push(`${fileName} -> archive/${dateFolder}/${archiveFileName}`);
        } catch (fileErr: any) {
          // Log error cleanly to console to prevent infinite logging loops
          console.error(
            `[LOG_ROTATION_ERROR] Failed to rotate log file '${fileName}':`,
            fileErr?.message || fileErr,
          );
        }
      }

      if (rotatedFiles.length > 0) {
        console.log(
          `[LOG_ROTATION_SUCCESS] Rotated ${rotatedFiles.length} file(s):\n  - ${rotatedFiles.join('\n  - ')}`,
        );
      }
    } catch (err: any) {
      console.error(
        '[LOG_ROTATION_ERROR] An error occurred during periodic log rotation:',
        err?.message || err,
      );
      return { success: false, rotatedFiles: [] };
    }

    return { success: true, rotatedFiles };
  }
}
