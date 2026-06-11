import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';
import type { AuthRequest } from '../shared/middleware';

export const doctorRouter = Router();

// ── Sample data (mirrors what the frontend hard-codes) ──────────────────────
const SAMPLE_DOCTOR = {
  id: 'doc_1',
  userId: 'usr_doctor_1',
  name: 'Dr. Arun Sharma',
  slug: 'dr-arun-sharma',
  specialisation: 'General Medicine',
  qualifications: 'MBBS, MD',
  registrationNumber: 'MH-2010-45821',
  council: 'Maharashtra Medical Council',
  clinicName: 'Sharma Clinic',
  city: 'Pune',
  bio: 'MBBS, MD. 14 years of practice in general medicine with a focus on preventive care and chronic disease management.',
  languages: ['Hindi', 'English', 'Marathi'],
  fees: { online: 500, inPerson: 700, followUp: 300 },
  slotDurationMins: 15,
  bufferMins: 5,
  maxPatientsPerDay: 25,
  isVerified: true,
  bookingUrl: 'curo.app/dr-arun-sharma',
};

const TODAY_APPOINTMENTS = [
  { id: 'a1', time: '09:00', patientName: 'Rohan Kumar',  initials: 'RK', age: 34, complaint: 'Recurring fever',       type: 'ONLINE',    status: 'CONFIRMED',    statusClass: 'badge-success' },
  { id: 'a2', time: '09:30', patientName: 'Priya Mehta',  initials: 'PM', age: 27, complaint: 'Migraine headache',     type: 'ONLINE',    status: 'IN_PROGRESS',  statusClass: 'badge-info' },
  { id: 'a3', time: '10:00', patientName: 'Ankit Joshi',  initials: 'AJ', age: 45, complaint: 'Back pain — chronic',   type: 'IN_PERSON', status: 'CONFIRMED',    statusClass: 'badge-success' },
  { id: 'a4', time: '10:30', patientName: 'Sunita Rao',   initials: 'SR', age: 52, complaint: 'Diabetes follow-up',    type: 'IN_PERSON', status: 'PAYMENT_DUE',  statusClass: 'badge-warning' },
  { id: 'a5', time: '11:00', patientName: 'Karan Desai',  initials: 'KD', age: 31, complaint: 'Digestive complaint',   type: 'ONLINE',    status: 'CONFIRMED',    statusClass: 'badge-success' },
  { id: 'a6', time: '11:30', patientName: 'Meera Pillai', initials: 'MP', age: 39, complaint: 'Skin rash — 2 weeks',   type: 'IN_PERSON', status: 'CONFIRMED',    statusClass: 'badge-success' },
  { id: 'a7', time: '14:00', patientName: 'Vijay Sharma', initials: 'VS', age: 60, complaint: 'BP + ECG review',       type: 'IN_PERSON', status: 'CONFIRMED',    statusClass: 'badge-success' },
  { id: 'a8', time: '15:00', patientName: 'Divya Nair',   initials: 'DN', age: 24, complaint: 'Throat infection',      type: 'ONLINE',    status: 'CONFIRMED',    statusClass: 'badge-success' },
];

const SLOTS = [
  { time: '09:00', status: 'taken' },
  { time: '09:30', status: 'next' },
  { time: '10:00', status: 'taken' },
  { time: '10:30', status: 'taken' },
  { time: '11:00', status: 'available' },
  { time: '11:30', status: 'available' },
  { time: '12:00', status: 'available' },
  { time: '14:00', status: 'available' },
  { time: '14:30', status: 'available' },
  { time: '15:00', status: 'available' },
  { time: '15:30', status: 'available' },
];

/** GET /api/v1/doctors/profile — returns authenticated doctor's profile */
doctorRouter.get('/profile', requireAuth, requireRole('DOCTOR'), (req: AuthRequest, res) => {
  return res.json({ success: true, data: SAMPLE_DOCTOR });
});

/** GET /api/v1/doctors/dashboard — today's stats + appointments + slots */
doctorRouter.get('/dashboard', requireAuth, requireRole('DOCTOR'), (_req, res) => {
  return res.json({
    success: true,
    data: {
      date: new Date().toISOString().split('T')[0],
      stats: {
        totalAppointments: 8,
        collected: 5600,
        pendingPayment: 1,
        completed: 3,
      },
      nextAppointment: TODAY_APPOINTMENTS[0],
      appointments: TODAY_APPOINTMENTS,
      slots: SLOTS,
      bookingUrl: SAMPLE_DOCTOR.bookingUrl,
    },
  });
});

/** GET /api/v1/doctors/schedule — weekly schedule */
doctorRouter.get('/schedule', requireAuth, requireRole('DOCTOR'), (_req, res) => {
  const schedule = [
    { day: 'Monday',    start: '09:00', end: '13:00', active: true, bufferMins: 5 },
    { day: 'Tuesday',   start: '09:00', end: '13:00', active: true, bufferMins: 5 },
    { day: 'Wednesday', start: '09:00', end: '13:00', active: true, bufferMins: 5 },
    { day: 'Thursday',  start: '09:00', end: '17:00', active: true, bufferMins: 5 },
    { day: 'Friday',    start: '09:00', end: '17:00', active: true, bufferMins: 5 },
    { day: 'Saturday',  start: '09:00', end: '12:00', active: true, bufferMins: 5 },
    { day: 'Sunday',    start: null,   end: null,    active: false, bufferMins: 0 },
  ];
  return res.json({ success: true, data: { schedule, blockedDates: ['2026-06-15', '2026-06-22'] } });
});

/** GET /api/v1/doctors/:slug/public — public doctor profile for booking page */
doctorRouter.get('/:slug/public', (req, res) => {
  if (req.params.slug !== 'dr-arun-sharma') {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }
  return res.json({
    success: true,
    data: {
      name: SAMPLE_DOCTOR.name,
      slug: SAMPLE_DOCTOR.slug,
      specialisation: SAMPLE_DOCTOR.specialisation,
      qualifications: SAMPLE_DOCTOR.qualifications,
      city: SAMPLE_DOCTOR.city,
      bio: SAMPLE_DOCTOR.bio,
      languages: SAMPLE_DOCTOR.languages,
      fees: SAMPLE_DOCTOR.fees,
      slotDurationMins: SAMPLE_DOCTOR.slotDurationMins,
      isVerified: SAMPLE_DOCTOR.isVerified,
    },
  });
});
