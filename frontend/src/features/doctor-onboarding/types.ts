export interface DoctorOnboardingPayload {
  fullName: string;
  specialization: string;
  clinicName: string;
  email: string;
  mobile: string;
}

export interface DoctorAppointment {
  id: string;
  patientName: string;
  slot: string;
  consultationType: 'online' | 'in_person' | 'follow_up';
  status: 'confirmed' | 'payment_pending' | 'cancelled';
}

export interface DoctorScheduleSlot {
  day: string;
  slots: string[];
}
