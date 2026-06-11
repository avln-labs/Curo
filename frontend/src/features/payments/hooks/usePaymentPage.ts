import { useState, useEffect } from 'react';
import { initializePayment, confirmPayment } from '../api';
import { PaymentResult } from '../types';

export function usePaymentPage() {
  const [initialized, setInitialized] = useState(false);
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const result = await initializePayment();
      setReference(result.reference);
      setInitialized(result.success);
      setLoading(false);
    }
    init();
  }, []);

  async function pay(success: boolean) {
    setLoading(true);
    const result = await confirmPayment(success);
    setStatus(result);
    setLoading(false);
  }

  return {
    initialized,
    loading,
    reference,
    status,
    pay,
  };
}
