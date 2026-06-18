import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  PORT: Number(getEnv('PORT', '4000')),
  DATABASE_URL: getEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/curo'),
  JWT_SECRET: getEnv('JWT_SECRET', 'curo-dev-secret'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '900'),
  REFRESH_TOKEN_EXPIRES_IN: getEnv('REFRESH_TOKEN_EXPIRES_IN', '604800'),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:5173'),

  // OTP Provider: 'console' | 'twilio'
  OTP_PROVIDER: getEnv('OTP_PROVIDER', 'console') as 'console' | 'twilio',

  // Twilio — only required when OTP_PROVIDER=twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? '',
  TWILIO_FROM: process.env.TWILIO_FROM ?? '',
};
