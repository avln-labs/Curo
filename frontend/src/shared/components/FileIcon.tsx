/** Small inline SVG icons for medical record file types. */

const COLORS: Record<string, string> = {
  pdf: '#DC2626',
  image: '#0F766E',
  doc: '#2563EB',
  other: '#6B7280',
};

export function fileKind(mimeType: string, name?: string): 'pdf' | 'image' | 'doc' | 'other' {
  const mt = (mimeType || '').toLowerCase();
  const ext = (name || '').split('.').pop()?.toLowerCase() || '';
  if (mt.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mt.startsWith('image/') || ['jpg', 'jpeg', 'png', 'heic'].includes(ext)) return 'image';
  if (mt.includes('word') || ['doc', 'docx'].includes(ext)) return 'doc';
  return 'other';
}

export function FileIcon({ mimeType, name, size = 34 }: { mimeType: string; name?: string; size?: number }) {
  const kind = fileKind(mimeType, name);
  const color = COLORS[kind];
  const label = kind === 'pdf' ? 'PDF' : kind === 'image' ? 'IMG' : kind === 'doc' ? 'DOC' : 'FILE';

  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <path d="M7 3h14l6 6v22a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill={color} opacity="0.12" />
      <path d="M7 3h14l6 6v22a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M21 3v6h6" fill="none" stroke={color} strokeWidth="1.5" />
      <text x="17" y="24" textAnchor="middle" fontSize="8" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">
        {label}
      </text>
    </svg>
  );
}
