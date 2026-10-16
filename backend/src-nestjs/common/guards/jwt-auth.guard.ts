import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    if (err || !user) {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        throw new UnauthorizedException(
          'Authentication required. Bearer token is missing.',
        );
      }
      throw new UnauthorizedException(
        'Session expired or invalid token. Please sign in again.',
      );
    }

    req.user = user;
    return user;
  }
}
