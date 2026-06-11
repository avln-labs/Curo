export interface ConsultationSession {
  id: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  date: string;
  time: string;
  status: 'confirmed' | 'in_progress' | 'completed';
  condition: string;
  lastVisit: string;
  summary: string;
  aiSummary: string;
  recommendation: string;
}

export interface ConsultationNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PrescriptionPreview {
  prescriptionId: string;
  patientName: string;
  medicines: Array<{ name: string; dose: string; frequency: string; duration: string }>;
  advice: string;
}
