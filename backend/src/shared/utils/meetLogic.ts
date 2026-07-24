export function getVisibleMeetLink(
  link: string | null | undefined,
  slotDate: string | Date,
  slotTime: string,
  status?: string
): string | null {
  if (!link) return null;
  
  if (status === 'in_progress') return link;
  
  const now = new Date();
  const dateStr = typeof slotDate === 'string' ? slotDate.split('T')[0] : slotDate.toISOString().split('T')[0];
  const slotStart = new Date(`${dateStr}T${slotTime}`);
  
  // Window starts 10 mins before the slot (matching frontend canJoinConsultation)
  const startWindow = new Date(slotStart.getTime() - 10 * 60 * 1000);
  // Window ends 60 mins after the slot to handle delays
  const endWindow = new Date(slotStart.getTime() + 60 * 60 * 1000);

  if (now >= startWindow && now <= endWindow) {
    return link;
  }
  
  return null;
}
