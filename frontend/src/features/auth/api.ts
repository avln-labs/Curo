import { AuthLoginPayload, AuthOtpRequest, AuthOtpVerifyPayload, AuthResult } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const otpStore = new Map<string, string>();

export async function requestOtp(payload: AuthOtpRequest): Promise<{ success: boolean; message: string }> {
  await delay(400);
  const identifier = payload.mobile ?? payload.email ?? '';
  if (!identifier) {
    return { success: false, message: 'Please provide a mobile number or email.' };
  }
  otpStore.set(identifier, '123456');
  return {
    success: true,
    message: `OTP sent to ${identifier}. Use 123456 to continue.`,
  };
}

export async function verifyOtp(payload: AuthOtpVerifyPayload): Promise<AuthResult> {
  await delay(400);
  const stored = otpStore.get(payload.identifier);
  const isValid = payload.otp === '123456' || payload.otp === stored;
  if (!isValid) {
    return { success: false, message: 'Invalid OTP', role: null, token: null };
  }

  const role = payload.role || 'PATIENT';
  return {
    success: true,
    message: 'Login successful',
    token: `mock-token-${payload.identifier}`,
    role,
  };
}

export async function loginUser(payload: AuthLoginPayload): Promise<AuthResult> {
  return verifyOtp({ identifier: payload.identifier, otp: payload.otp, role: payload.role });
}
