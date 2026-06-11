import jwt from 'jsonwebtoken';
import { env } from './env';
import type { UserRole } from './store';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  mobile: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: Number(env.JWT_EXPIRES_IN),
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: Number(env.REFRESH_TOKEN_EXPIRES_IN),
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
}
