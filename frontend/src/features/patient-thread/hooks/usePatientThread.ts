import { useEffect, useState } from 'react';
import { fetchConsultations } from '../../consultations/api';
import { fetchHealthThreadData } from '../../health_threads/api';
import { PatientThreadResult } from '../types';

export function usePatientThread(id: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PatientThreadResult | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // compose a simple patient thread from existing mock endpoints
      const sessions = await fetchConsultations();
      const threads = await fetchHealthThreadData();

      const session = sessions.find((s) => s.id === id) ?? sessions[0];
      const related = threads.threads;

      setData({
        id: session?.id ?? 'unknown',
        patientName: session?.patientName ?? 'Unknown',
        age: (session as any)?.age ?? undefined,
        gender: (session as any)?.gender ?? undefined,
        aiMemory: session?.aiSummary ?? session?.summary ?? 'No summary available.',
        events: related.map((t) => ({ id: t.id, date: t.date, source: t.category, title: t.title, content: t.description })),
        prescriptions: [
          { id: 'rx-1', summary: 'Atenolol 50mg once daily', issuedOn: '2026-05-30' },
        ],
      });

      setLoading(false);
    }
    load();
  }, [id]);

  return { loading, data };
}
