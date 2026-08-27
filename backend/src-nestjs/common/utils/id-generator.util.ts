import * as crypto from 'crypto';

export function generateCustomId(prefix: string): string {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(3).toString('hex');
  return `${prefix}_${timestamp}_${randomHex}`;
}
