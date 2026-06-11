import { BookingPayload, BookingConfirmation, DoctorProfile } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const doctors: DoctorProfile[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ayesha Rao',
    speciality: 'Family Medicine',
    rating: 4.8,
    nextAvailable: 'Today 4:00 PM',
    availableSlots: ['4:00 PM', '4:30 PM', '5:00 PM'],
  },
  {
    id: 'doc-2',
    name: 'Dr. Rajiv Mehta',
    speciality: 'General Physician',
    rating: 4.6,
    nextAvailable: 'Today 3:30 PM',
    availableSlots: ['3:30 PM', '4:15 PM', '5:00 PM'],
  },
];

export async function fetchDoctorsForBooking(): Promise<DoctorProfile[]> {
  await delay(300);
  return doctors;
}

export async function submitBooking(payload: BookingPayload): Promise<BookingConfirmation> {
  await delay(400);
  return {
    success: true,
    bookingId: `BOOK-${Math.floor(1000 + Math.random() * 9000)}`,
    doctorName: payload.doctorName,
    slot: payload.slot,
    patientName: payload.patientName,
    message: 'Booking confirmed. You can view the appointment in the patient portal.',
  };
}
