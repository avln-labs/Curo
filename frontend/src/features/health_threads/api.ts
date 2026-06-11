import { HealthThreadResult } from './types';

export async function fetchHealthThreadData(): Promise<HealthThreadResult> {
  return {
    success: true,
    message: 'Health timeline loaded.',
    threads: [
      { id: 't1', title: 'Initial assessment', date: '2026-06-02', description: 'Patient reported fatigue and dizziness; review labs and medication adherence.', category: 'Consultation' },
      { id: 't2', title: 'Lab results available', date: '2026-06-04', description: 'HbA1c improved, cholesterol stable. Recommend continue current diet plan.', category: 'Lab' },
      { id: 't3', title: 'Prescription update', date: '2026-06-06', description: 'Added vitamin D supplementation and insulin reminder support.', category: 'Medication' },
    ],
  };
}
