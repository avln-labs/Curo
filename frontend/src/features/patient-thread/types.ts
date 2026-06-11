export interface PatientThreadEvent {
  id: string;
  date: string;
  source: string;
  title: string;
  content: string;
}

export interface PatientThreadResult {
  id: string;
  patientName: string;
  age?: number;
  gender?: string;
  aiMemory: string;
  events: PatientThreadEvent[];
  prescriptions: Array<{ id: string; summary: string; issuedOn: string }>;
}
