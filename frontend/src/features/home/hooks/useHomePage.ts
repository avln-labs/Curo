import { useMemo } from 'react';
import { HomeQuickLink } from '../types';

const doctorLinks: HomeQuickLink[] = [
  { title: 'Dashboard', description: "Today's schedule, stats, and appointment list.", route: '/dashboard' },
  { title: 'Consultations', description: 'Access active consultation sessions and notes.', route: '/consultations' },
  { title: 'Schedule', description: 'Manage your weekly availability and blocked dates.', route: '/doctor-schedule' },
  { title: 'Health Records', description: 'View stored reports, prescriptions, and share links.', route: '/records' },
  { title: 'Doctor Setup', description: 'Complete onboarding and manage your clinic profile.', route: '/doctor-onboarding' },
];

const patientLinks: HomeQuickLink[] = [
  { title: 'Book a Consultation', description: 'Find a doctor and book a slot.', route: '/booking/details' },
  { title: 'Health Records', description: 'View your consultation history and records.', route: '/records' },
];

export function useHomePage(role?: string) {
  const quickLinks = useMemo(
    () => (role === 'DOCTOR' ? doctorLinks : patientLinks),
    [role]
  );

  return { quickLinks };
}
