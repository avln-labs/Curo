export type AuthRole = 'DOCTOR' | 'PATIENT';

export interface AuthOtpRequest {
  mobile?: string;
  email?: string;
  role: AuthRole;
}

export interface AuthOtpVerifyPayload {
  identifier: string;
  otp: string;
  role?: AuthRole;
}

export interface AuthLoginPayload {
  identifier: string;
  otp: string;
  role: AuthRole;
}

export interface AuthResult {
  success: boolean;
  message: string;
  token: string | null;
  role: AuthRole | null;
}
