/**
 * MedicineAutocomplete — formulary-backed drug name input (US-D04 AC2, BR-13).
 *
 * Typing "Para" suggests "Paracetamol" with a dosage-form image, generic name,
 * common strengths, and a Schedule H/H1/X warning badge for controlled drugs.
 *
 * - Debounced search (150ms) against /medicines/search
 * - Full keyboard support (↑ ↓ Enter Esc)
 * - Free-text is still allowed — the formulary assists, never blocks.
 */

import { useEffect, useRef, useState } from 'react';
import { medicinesApi, type MedicineSuggestion } from '../../../shared/api';
import { MedicineImage } from './MedicineImage';

interface Props {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSelect?: (med: MedicineSuggestion) => void;
}

export function MedicineAutocomplete({ value, disabled, placeholder, onChange, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<MedicineSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const skipNextSearch = useRef(false);

  // Debounced lookup
  useEffect(() => {
    if (skipNextSearch.current) { skipNextSearch.current = false; return; }
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      const res = await medicinesApi.search(value);
      const data = res.data?.data ?? [];
      setSuggestions(data);
      setHighlight(0);
      setOpen(data.length > 0);
    }, 150);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function select(med: MedicineSuggestion) {
    skipNextSearch.current = true;
    onChange(med.name);
    setScheduleWarning(
      med.schedule ? `Schedule ${med.schedule} — controlled substance. Prescribe with caution.` : null
    );
    setOpen(false);
    onSelect?.(med);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => (h + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter') { e.preventDefault(); select(suggestions[highlight]); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="autocomplete" ref={wrapperRef}>
      <input
        className="input"
        style={{ width: '100%', padding: '12px 16px', fontSize: '1.1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', outline: 'none' }}
        value={value}
        disabled={disabled}
        placeholder={placeholder || 'Drug name — try "Para"'}
        onChange={(e) => { onChange(e.target.value); setScheduleWarning(null); }}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
      />

      {open && (
        <ul className="autocomplete-list" role="listbox">
          {suggestions.map((med, i) => (
            <li
              key={med.id}
              role="option"
              aria-selected={i === highlight}
              className={`autocomplete-item${i === highlight ? ' highlighted' : ''}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => { e.preventDefault(); select(med); }}
            >
              <MedicineImage form={med.form} size={40} />
              <div className="autocomplete-item-body">
                <div className="autocomplete-item-name">
                  {med.name}
                  {med.schedule && <span className="badge badge-warning schedule-badge">Sch. {med.schedule}</span>}
                </div>
                <div className="autocomplete-item-meta">
                  {med.generic !== med.name ? `${med.generic} · ` : ''}{med.form}
                  {med.strengths.length > 0 ? ` · ${med.strengths.slice(0, 3).join(', ')}` : ''}
                </div>
                <div className="autocomplete-item-category">{med.category}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {scheduleWarning && (
        <div className="schedule-warning" role="alert">⚠ {scheduleWarning}</div>
      )}
    </div>
  );
}
