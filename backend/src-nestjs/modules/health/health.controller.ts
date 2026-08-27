import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHealth() {
    const nestPort = this.configService.get<number>('nestPort') || 5001;
    return {
      status: 'ok',
      server: 'NestJS Migration Server',
      platform: 'Wavevents Event Management & Post-Event Analytics',
      port: nestPort,
      timestamp: new Date().toISOString(),
    };
  }
}
