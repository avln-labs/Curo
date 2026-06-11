import { useEffect, useState } from 'react';
import { fetchPrescriptionData } from '../api';
import { PrescriptionItem } from '../types';

export function usePrescriptionPage() {
  const [message, setMessage] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);

  useEffect(() => {
    async function load() {
      const result = await fetchPrescriptionData();
      setMessage(result.message);
      setPrescriptions(result.prescriptions);
    }
    load();
  }, []);

  return { message, prescriptions };
}
