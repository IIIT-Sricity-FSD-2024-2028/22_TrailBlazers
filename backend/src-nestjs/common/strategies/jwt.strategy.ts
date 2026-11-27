import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InMemoryStore } from '../../repositories/in-memory.store';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  emailVerified: boolean | number;
  organization: string | null;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly store: InMemoryStore,
  ) {
    const secret =
      configService.get<string>('jwtSecret') ||
      'ffsd-event-platform-secret-key-2026';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const user = this.store.findById<any>('users', payload.id);
    let role = user?.role || payload.role;

    // If an attendee has requested/created events, automatically recognize & upgrade them to CLIENT
    if (role === 'ATTENDEE' || !role) {
      const hasEvent = this.store.findOne('event_requests', (r: any) => r.userId === payload.id);
      if (hasEvent) {
        role = 'CLIENT';
        if (user && user.role !== 'CLIENT') {
          this.store.update<any>('users', user.id, { role: 'CLIENT' });
        }
      }
    }

    return {
      id: payload.id,
      email: user?.email || payload.email,
      name: user?.name || payload.name,
      role: role,
      department: user?.department || payload.department || null,
      emailVerified: Boolean(user?.emailVerified ?? payload.emailVerified),
      organization: user?.organization || payload.organization || null,
    };
  }
}
