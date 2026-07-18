export function getVisibleMeetLink(
  link: string | null | undefined,
  slotDate: string | Date,
  slotTime: string
): string | null {
  if (!link) return null;
  
  const now = new Date();
  const dateStr = typeof slotDate === 'string' ? slotDate.split('T')[0] : slotDate.toISOString().split('T')[0];
  const slotStart = new Date(`${dateStr}T${slotTime}`);
  
  // Window starts 5 mins before the slot
  const startWindow = new Date(slotStart.getTime() - 5 * 60 * 1000);
  // Window ends 20 mins after the slot (assuming 15 min default duration + 5 min grace)
  const endWindow = new Date(slotStart.getTime() + 20 * 60 * 1000);

  if (now >= startWindow && now <= endWindow) {
    return link;
  }
  
  return null;
}
