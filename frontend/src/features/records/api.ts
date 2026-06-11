import { RecordsResult } from './types';

export async function fetchRecordsData(): Promise<RecordsResult> {
  return {
    success: true,
    message: 'Patient records loaded.',
    sharedLink: 'https://curo.app/records/share/abc123',
    records: [
      { id: 'r1', title: 'Diabetes follow-up', category: 'Consultation Note', date: '2026-06-02', status: 'Signed' },
      { id: 'r2', title: 'Blood Test Report', category: 'Lab Result', date: '2026-05-23', status: 'Available' },
      { id: 'r3', title: 'Prescription refill', category: 'Prescription', date: '2026-05-17', status: 'Reviewed' },
    ],
  };
}
