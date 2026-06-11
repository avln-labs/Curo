import { useEffect, useState } from 'react';
import { fetchRecordsData } from '../api';
import { RecordsItem } from '../types';

export function useRecordsPage() {
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState<RecordsItem[]>([]);
  const [sharedLink, setSharedLink] = useState('');

  useEffect(() => {
    async function load() {
      const result = await fetchRecordsData();
      setMessage(result.message);
      setRecords(result.records);
      setSharedLink(result.sharedLink);
    }
    load();
  }, []);

  return { message, records, sharedLink };
}
