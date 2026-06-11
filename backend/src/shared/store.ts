// In-memory OTP store — replace with Redis in production
// Key: mobile number, Value: { otp, expiresAt, attempts }
export const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

// In-memory user store — replace with PostgreSQL in production
// Seeded with demo users matching the frontend sample data
export type UserRole = 'DOCTOR' | 'PATIENT' | 'ADMIN';

export interface StoredUser {
  id: string;
  mobile: string;
  email?: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  createdAt: string;
  // Doctor-specific
  doctorId?: string;
  slug?: string;
  // Patient-specific
  patientId?: string;
}

export const userStore = new Map<string, StoredUser>([
  [
    '9876543210',
    {
      id: 'usr_doctor_1',
      mobile: '9876543210',
      email: 'arun.sharma@example.com',
      role: 'DOCTOR',
      name: 'Dr. Arun Sharma',
      isActive: true,
      createdAt: '2025-01-15T09:00:00Z',
      doctorId: 'doc_1',
      slug: 'dr-arun-sharma',
    },
  ],
  [
    '9123456789',
    {
      id: 'usr_patient_1',
      mobile: '9123456789',
      email: 'rohan.kumar@example.com',
      role: 'PATIENT',
      name: 'Rohan Kumar',
      isActive: true,
      createdAt: '2025-03-10T11:00:00Z',
      patientId: 'pat_1',
    },
  ],
  [
    '9000000000',
    {
      id: 'usr_admin_1',
      mobile: '9000000000',
      email: 'admin@curo.app',
      role: 'ADMIN',
      name: 'Curo Admin',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
    },
  ],
]);

// Refresh token store — replace with DB in production
export const refreshTokenStore = new Map<string, { userId: string; expiresAt: number }>();

// Generate a 6-digit OTP
export function generateOtp(): string {
  // In development: always return 123456 for easy testing
  return '123456';
}

// OTP expiry: 5 minutes
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 3;
