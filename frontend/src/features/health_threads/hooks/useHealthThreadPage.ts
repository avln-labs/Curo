import { useEffect, useState } from 'react';
import { fetchHealthThreadData } from '../api';
import { HealthThreadItem } from '../types';

export function useHealthThreadPage() {
  const [message, setMessage] = useState('');
  const [threads, setThreads] = useState<HealthThreadItem[]>([]);

  useEffect(() => {
    async function load() {
      const result = await fetchHealthThreadData();
      setMessage(result.message);
      setThreads(result.threads);
    }
    load();
  }, []);

  return { message, threads };
}
