import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export const SUPPORTED_API_VERSIONS = new Set(['v1', 'v2']);
export const DEFAULT_API_VERSION = 'v1';

declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction) {
    const versionHeader = req.headers['x-api-version'];

    if (!versionHeader) {
      // Default to v1 when header is omitted to preserve 100% existing frontend compatibility
      req.apiVersion = DEFAULT_API_VERSION;
      return next();
    }

    const normalizedVersion = String(versionHeader).trim().toLowerCase();

    if (!SUPPORTED_API_VERSIONS.has(normalizedVersion)) {
      const requestId = req.id || (req.headers['x-request-id'] as string) || 'req_unknown';
      return res.status(400).json({
        statusCode: 400,
        error: 'Bad Request',
        message: `Invalid API version specified: '${versionHeader}'. Supported API versions are: ${Array.from(SUPPORTED_API_VERSIONS).join(', ')}.`,
        requestId,
      });
    }

    req.apiVersion = normalizedVersion;
    next();
  }
}
