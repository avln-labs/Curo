import { useEffect, useState } from 'react';
import { fetchAdminDashboard } from '../api';
import { AdminStatsItem, AdminVerificationItem } from '../types';

export function useAdminPanel() {
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<AdminStatsItem[]>([]);
  const [queue, setQueue] = useState<AdminVerificationItem[]>([]);

  useEffect(() => {
    async function load() {
      const result = await fetchAdminDashboard();
      setMessage(result.message);
      setStats(result.stats);
      setQueue(result.queue);
    }
    load();
  }, []);

  return { message, stats, queue };
}
