export interface PrescriptionItem {
  id: string;
  patientName: string;
  issuedOn: string;
  medicineSummary: string;
  status: string;
}

export interface PrescriptionResult {
  success: boolean;
  message: string;
  prescriptions: PrescriptionItem[];
}
