/**
 * Doctor Registration Verification
 *
 * This module provides a stub for verifying medical registration numbers
 * against the National Medical Commission (NMC) or State Council APIs.
 *
 * Current behaviour (MVP):
 *   - Format-validates the registration number pattern
 *   - Queues doctor for manual admin review
 *   - Returns { isValid: true } optimistically so onboarding is not blocked
 *
 * Future integration points:
 *   - NMC API: https://www.nmc.org.in (no public API as of 2026; manual lookup)
 *   - State council APIs (Maharashtra, Delhi, Karnataka, etc.)
 *   - Third-party verification services (e.g. Setu, Signzy)
 *
 * To activate real verification:
 *   1. Implement the `callNmcApi()` function below
 *   2. Set DOCTOR_VERIFICATION_MODE=strict in .env
 *   3. Return { isValid: false } when the API confirms the number is invalid
 */

export interface VerificationResult {
  isValid: boolean;
  doctorName?: string;         // Name as per council records
  council?: string;            // Verified council name
  source?: 'nmc_api' | 'state_council' | 'manual_review';
  requiresManualReview: boolean;
}

// Known Indian medical registration number patterns
const REGISTRATION_PATTERNS: Record<string, RegExp> = {
  'MCI':  /^MH-\d{4}-\d{5}$/i,
  'DMC':  /^DMC\/\d{4}\/\d{5}$/i,
  'KMC':  /^KAR\/\d{6}$/i,
  'TNMC': /^TN\/\d{6}$/i,
  // Fallback: generic alphanumeric
  'generic': /^[A-Z0-9\-\/]{5,20}$/i,
};

/**
 * Validate the format of a registration number.
 * Returns true if any known pattern matches.
 */
export function validateRegistrationNumberFormat(
  regNumber: string,
  _council?: string
): boolean {
  for (const pattern of Object.values(REGISTRATION_PATTERNS)) {
    if (pattern.test(regNumber.trim())) return true;
  }
  return false;
}

/**
 * Main verification function.
 *
 * MVP: always returns { isValid: true, requiresManualReview: true }
 * so the doctor can complete onboarding while admin reviews their credentials.
 *
 * The admin panel shows all doctors with verification_status = 'pending'
 * and their supplied registration details.
 */
export async function verifyDoctorRegistration(
  registrationNumber: string,
  registrationCouncil: string
): Promise<VerificationResult> {
  const formatOk = validateRegistrationNumberFormat(registrationNumber, registrationCouncil);

  if (!formatOk) {
    return {
      isValid: false,
      requiresManualReview: false,
    };
  }

  // TODO: Replace with real NMC/State Council API call when available
  // Example stub:
  // const apiResult = await callNmcApi(registrationNumber, registrationCouncil);
  // if (apiResult.found) {
  //   return { isValid: true, doctorName: apiResult.name, source: 'nmc_api', requiresManualReview: false };
  // }

  // For now: queue for manual admin review
  return {
    isValid: true,
    source: 'manual_review',
    requiresManualReview: true,
  };
}
