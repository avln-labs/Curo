import { PrescriptionResult } from './types';

export async function fetchPrescriptionData(): Promise<PrescriptionResult> {
  return {
    success: true,
    message: 'Prescription records loaded.',
    prescriptions: [
      { id: 'p1', patientName: 'Amit Shah', issuedOn: '2026-05-30', medicineSummary: 'Metformin 500mg, Vitamin D', status: 'Active' },
      { id: 'p2', patientName: 'Priya Das', issuedOn: '2026-05-18', medicineSummary: 'Amoxicillin 500mg', status: 'Completed' },
      { id: 'p3', patientName: 'Rohan Mehra', issuedOn: '2026-05-13', medicineSummary: 'Ibuprofen 200mg', status: 'Renewal request' },
    ],
  };
}
