import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestOtp, verifyOtp } from '../api';
import { AuthLoginPayload, AuthOtpRequest, AuthRole, AuthResult } from '../types';

export function useLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<AuthRole>('PATIENT');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(payload: AuthOtpRequest) {
    setLoading(true);
    const result = await requestOtp(payload);
    setStatus(result.message);
    setOtpSent(result.success);
    setLoading(false);
  }

  async function handleVerifyOtp(payload: AuthLoginPayload) {
    setLoading(true);
    const result = await verifyOtp(payload);
    setStatus(result.message);
    setLoading(false);

    if (result.success) {
      window.localStorage.setItem('curo_auth_token', result.token ?? '');
      window.localStorage.setItem('curo_auth_role', result.role ?? 'PATIENT');
      navigate(result.role === 'DOCTOR' ? '/doctor-dashboard' : '/booking');
    }
  }

  return {
    identifier,
    role,
    otp,
    status,
    loading,
    otpSent,
    setIdentifier,
    setRole,
    setOtp,
    handleRequestOtp,
    handleVerifyOtp,
  };
}
