import { useMemo } from 'react';
import { HomeQuickLink, HomeStats } from '../types';

const quickLinks: HomeQuickLink[] = [
  { title: 'Book a Consultation', description: 'Patient booking flow with doctor discovery and slot selection.', route: '/booking' },
  { title: 'Review Consultations', description: 'Access active consultation sessions and notes.', route: '/consultations' },
  { title: 'Doctor Workspace', description: 'Open onboarding, dashboard, and schedule screens.', route: '/doctor-dashboard' },
  { title: 'Health Records', description: 'View stored reports, prescriptions, and share links.', route: '/records' },
  { title: 'Payment Mock', description: 'Simulate checkout outcomes and verify gateway behavior.', route: '/payments' },
  { title: 'Admin Console', description: 'Inspect verification queue and platform analytics.', route: '/admin' },
];

const stats: HomeStats[] = [
  { label: 'Doctors', value: '18', description: 'Profiles active in the system.' },
  { label: 'Bookings', value: '73', description: 'Confirmed consultations this week.' },
  { label: 'Consultations', value: '24', description: 'Open sessions in the doctor workspace.' },
  { label: 'Shared Records', value: '12', description: 'Patient records shared with clinics.' },
];

export function useHomePage() {
  return {
    quickLinks: useMemo(() => quickLinks, []),
    stats: useMemo(() => stats, []),
  };
}
