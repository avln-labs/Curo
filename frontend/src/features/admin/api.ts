import { AdminPanelResult } from './types';

export async function fetchAdminDashboard(): Promise<AdminPanelResult> {
  return {
    success: true,
    message: 'Admin dashboard loaded.',
    stats: [
      { label: 'Pending approvals', value: '4', note: 'Doctors awaiting verification' },
      { label: 'Clinic reports', value: '12', note: 'New record uploads this week' },
      { label: 'Active bookings', value: '83', note: 'Confirmed sessions in the last 7 days' },
    ],
    queue: [
      { id: 'req-01', name: 'Dr. Shreya Nair', specialty: 'General Medicine', submittedAt: '2 hours ago', status: 'pending' },
      { id: 'req-02', name: 'Dr. Arjun Patel', specialty: 'Physiotherapy', submittedAt: '5 hours ago', status: 'pending' },
      { id: 'req-03', name: 'Dr. Meera Rao', specialty: 'Pediatrics', submittedAt: '1 day ago', status: 'review' },
    ],
  };
}
