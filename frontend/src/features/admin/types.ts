export interface AdminVerificationItem {
  id: string;
  name: string;
  specialty: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'review';
}

export interface AdminStatsItem {
  label: string;
  value: string;
  note: string;
}

export interface AdminPanelResult {
  success: boolean;
  message: string;
  queue: AdminVerificationItem[];
  stats: AdminStatsItem[];
}
