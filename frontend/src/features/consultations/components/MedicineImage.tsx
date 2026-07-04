/**
 * MedicineImage — lightweight inline SVG illustration per dosage form.
 * No external image service needed (offline-safe, zero latency, no licensing).
 */

interface Props {
  form: string;
  size?: number;
}

const TEAL = '#0F766E';
const LIGHT = '#CCFBF1';
const AMBER = '#D97706';
const AMBER_LIGHT = '#FEF3C7';

export function MedicineImage({ form, size = 40 }: Props) {
  const f = form.toLowerCase();
  let art: JSX.Element;

  if (f === 'capsule') {
    art = (
      <g>
        <rect x="8" y="16" width="24" height="10" rx="5" fill={AMBER_LIGHT} stroke={AMBER} strokeWidth="1.5" transform="rotate(-20 20 21)" />
        <path d="M20.5 14.5 L 17 26" stroke={AMBER} strokeWidth="1.5" transform="rotate(0)" />
      </g>
    );
  } else if (f === 'syrup' || f === 'suspension' || f === 'lotion') {
    art = (
      <g>
        <rect x="16" y="6" width="8" height="5" rx="1" fill={TEAL} />
        <path d="M14 12h12v16a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill={LIGHT} stroke={TEAL} strokeWidth="1.5" />
        <rect x="15.5" y="20" width="9" height="9" rx="1.5" fill={TEAL} opacity="0.35" />
      </g>
    );
  } else if (f === 'injection') {
    art = (
      <g transform="rotate(45 20 20)">
        <rect x="14" y="10" width="12" height="16" rx="2" fill={LIGHT} stroke={TEAL} strokeWidth="1.5" />
        <rect x="18" y="4" width="4" height="6" fill={TEAL} />
        <path d="M20 26v8" stroke={TEAL} strokeWidth="2" />
      </g>
    );
  } else if (f === 'cream' || f === 'ointment' || f === 'gel') {
    art = (
      <g>
        <path d="M13 14h14l-2 16a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill={LIGHT} stroke={TEAL} strokeWidth="1.5" />
        <rect x="16" y="8" width="8" height="6" rx="1" fill={TEAL} />
      </g>
    );
  } else if (f === 'drops') {
    art = (
      <g>
        <path d="M20 7c4 6 7 10 7 14a7 7 0 1 1-14 0c0-4 3-8 7-14z" fill={LIGHT} stroke={TEAL} strokeWidth="1.5" />
        <circle cx="17.5" cy="22" r="2" fill={TEAL} opacity="0.4" />
      </g>
    );
  } else if (f === 'inhaler') {
    art = (
      <g>
        <rect x="15" y="8" width="8" height="16" rx="2" fill={LIGHT} stroke={TEAL} strokeWidth="1.5" />
        <path d="M15 24h8v4a2 2 0 0 1-2 2h-8a4 4 0 0 1 2-6z" fill={TEAL} opacity="0.75" />
      </g>
    );
  } else if (f === 'powder') {
    art = (
      <g>
        <path d="M11 12h18l-2 18H13z" fill={LIGHT} stroke={TEAL} strokeWidth="1.5" />
        <path d="M11 12l2-4h14l2 4" fill="none" stroke={TEAL} strokeWidth="1.5" />
      </g>
    );
  } else {
    // tablet (default)
    art = (
      <g>
        <circle cx="20" cy="20" r="11" fill={LIGHT} stroke={TEAL} strokeWidth="1.5" />
        <path d="M9.5 20h21" stroke={TEAL} strokeWidth="1.5" />
      </g>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="medicine-image" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="var(--surface-raised, #F5F5F4)" />
      {art}
    </svg>
  );
}
