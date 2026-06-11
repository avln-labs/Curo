import { DoctorOnboardingPayload, DoctorAppointment, DoctorScheduleSlot } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function submitDoctorProfile(payload: DoctorOnboardingPayload) {
  await delay(400);
  return {
    success: true,
    doctorId: 'doctor-123',
    message: `Doctor profile created for ${payload.fullName}`,
  };
}

export async function fetchDoctorAppointments(): Promise<DoctorAppointment[]> {
  await delay(300);
  return [
    {
      id: 'appt-1',
      patientName: 'Neha Sharma',
      slot: 'Mon 9:00 AM',
      consultationType: 'online',
      status: 'confirmed',
    },
    {
      id: 'appt-2',
      patientName: 'Amit Singh',
      slot: 'Mon 10:00 AM',
      consultationType: 'in_person',
      status: 'payment_pending',
    },
    {
      id: 'appt-3',
      patientName: 'Sana Patel',
      slot: 'Mon 11:30 AM',
      consultationType: 'follow_up',
      status: 'confirmed',
    },
  ];
}

export async function fetchDoctorSchedule(): Promise<DoctorScheduleSlot[]> {
  await delay(250);
  return [
    { day: 'Monday', slots: ['9:00 AM', '10:00 AM', '11:30 AM'] },
    { day: 'Tuesday', slots: ['11:00 AM', '1:00 PM', '3:00 PM'] },
    { day: 'Wednesday', slots: ['9:30 AM', '12:00 PM', '2:30 PM'] },
    { day: 'Thursday', slots: ['10:00 AM', '1:30 PM', '4:00 PM'] },
    { day: 'Friday', slots: ['9:00 AM', '11:00 AM', '2:00 PM'] },
  ];
}
