import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestContext {
  method: string;
  path: string;
  clientIp: string;
  userAgent: string;
  receivedAt: string;
}

declare global {
  namespace Express {
    interface Request {
      requestContext?: RequestContext;
    }
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const path = req.path || req.originalUrl?.split('?')[0] || req.url?.split('?')[0] || '';
    
    // Extract client IP safely from x-forwarded-for or connection socket
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : Array.isArray(forwarded) ? forwarded[0] : null) ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser/Client';
    const receivedAt = new Date().toISOString();

    // Attach normalized, read-only transport-level request context for downstream components
    req.requestContext = {
      method,
      path,
      clientIp,
      userAgent,
      receivedAt,
    };

    next();
  }
}
