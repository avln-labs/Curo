import { ConsultationSession, ConsultationNote, PrescriptionPreview } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchConsultations(): Promise<ConsultationSession[]> {
  await delay(300);
  return [
    {
      id: 'consult-1',
      patientName: 'Rhea Kapoor',
      age: 42,
      gender: 'Female',
      date: '2026-06-09',
      time: '11:00 AM',
      status: 'in_progress',
      condition: 'Hypertension follow-up',
      lastVisit: '2026-05-25',
      summary: 'Follow-up on hypertension medication with stable vitals.',
      aiSummary: 'Patient continues to respond well to current therapy with minimal side effects.',
      recommendation: 'Continue medication, monitor BP daily, and schedule a diet review in 2 weeks.',
    },
    {
      id: 'consult-2',
      patientName: 'Karan Desai',
      age: 34,
      gender: 'Male',
      date: '2026-06-09',
      time: '2:00 PM',
      status: 'confirmed',
      condition: 'Digestive complaint',
      lastVisit: '2026-05-20',
      summary: 'New patient consultation for digestive discomfort and abdominal pain.',
      aiSummary: 'Possible gastritis with referral for dietary optimisation.',
      recommendation: 'Prescribe short course antacid, add fiber-rich diet, and re-evaluate in one week.',
    },
  ];
}

export async function fetchConsultationNotes(): Promise<ConsultationNote[]> {
  await delay(200);
  return [
    {
      id: 'note-1',
      author: 'Dr. Ayesha Rao',
      content: 'Patient reported mild dizziness. Blood pressure is stable with current dose.',
      createdAt: '2026-06-09 11:10',
    },
    {
      id: 'note-2',
      author: 'Dr. Ayesha Rao',
      content: 'Recommend follow-up in two weeks and continue current lifestyle changes.',
      createdAt: '2026-06-09 11:20',
    },
  ];
}

export async function fetchPrescriptionPreview(): Promise<PrescriptionPreview> {
  await delay(200);
  return {
    prescriptionId: 'rx-7834',
    patientName: 'Rhea Kapoor',
    medicines: [
      { name: 'Atenolol', dose: '50mg', frequency: 'Once daily', duration: '30 days' },
      { name: 'Tab Calcium', dose: '500mg', frequency: 'Once daily', duration: '30 days' },
    ],
    advice: 'Take medicines after food and monitor blood pressure daily.',
  };
}
