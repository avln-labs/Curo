export type BookingStep = 'select_doctor' | 'fill_details' | 'confirmation';

export interface DoctorProfile {
  id: string;
  name: string;
  speciality: string;
  rating: number;
  nextAvailable: string;
  availableSlots: string[];
}

export interface BookingPayload {
  doctorId: string;
  doctorName: string;
  slot: string;
  patientName: string;
  mobile: string;
  symptoms: string;
}

export interface BookingConfirmation {
  success: boolean;
  bookingId: string;
  doctorName: string;
  slot: string;
  patientName: string;
  message: string;
}
