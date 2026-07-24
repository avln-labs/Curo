/**
 * PreConsultSummary — the 20-second AI briefing (US-D03).
 *
 * - Loads async with a skeleton (AC6 — never blocks the dashboard)
 * - Shows source footer for traceability (AC3)
 * - Doctor can edit; the edited copy is saved separately, original preserved (AC4)
 * - Graceful fallback + insufficient-data states (AC5, §7.3)
 */

import { useEffect, useState } from 'react';
import { consultationsApi, type AiSummary } from '../../../shared/api';

export function PreConsultSummary({ appointmentId }: { appointmentId: string }) {
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    const res = await consultationsApi.getSummary(appointmentId, refresh);
    if (res.data?.success) {
      setSummary(res.data.data);
    } else {
      setError('AI summary temporarily unavailable. Patient intake details are shown alongside.');
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    setSummary(null);
    setEditing(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  async function handleSave() {
    if (!draft.trim()) return;
    setSaving(true);
    const res = await consultationsApi.saveSummaryEdit(appointmentId, draft);
    setSaving(false);
    if (res.data?.success) {
      setSummary((s) => (s ? { ...s, editedSummary: draft.trim() } : s));
      setEditing(false);
    } else {
      setError(res.error || 'Could not save the edited summary.');
    }
  }

  const displayText = summary?.editedSummary || summary?.summary || '';

  return (
    <section className="ai-summary" aria-label="AI pre-consult summary">
      <div className="ai-summary-header">
        <h3 className="ai-summary-title">
          <span className="ai-summary-spark" aria-hidden="true">✦</span> AI Pre-Consult Summary
        </h3>
        <div className="ai-summary-actions">
          {summary && !editing && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setDraft(displayText); setEditing(true); }}
              >
                Edit
              </button>
              <button
                className={`btn btn-ghost btn-sm${refreshing ? ' loading' : ''}`}
                onClick={() => load(true)}
                disabled={refreshing}
                title="Regenerate from latest data"
              >
                ↻ Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="skeleton-group" aria-busy="true" aria-label="Generating summary">
          <div className="skeleton skeleton-line" style={{ width: '92%' }} />
          <div className="skeleton skeleton-line" style={{ width: '100%' }} />
          <div className="skeleton skeleton-line" style={{ width: '84%' }} />
          <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        </div>
      ) : error ? (
        <div className="ai-summary-fallback">{error}</div>
      ) : editing ? (
        <div>
          <textarea
            className="input"
            rows={7}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Edit summary"
          />
          <div className="ai-summary-edit-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
            <button className={`btn btn-primary btn-sm${saving ? ' loading' : ''}`} onClick={handleSave} disabled={saving || !draft.trim()}>
              Save Summary
            </button>
          </div>
        </div>
      ) : summary ? (
        <>
          <div className="ai-summary-body">
            {(() => {
              const lines = displayText.split('\n').filter(Boolean);
              const elements: React.ReactNode[] = [];
              let currentList: React.ReactNode[] = [];

              const flushList = () => {
                if (currentList.length > 0) {
                  elements.push(<ul key={`ul-${elements.length}`} className="ai-summary-list">{currentList}</ul>);
                  currentList = [];
                }
              };

              const parseInline = (text: string, baseKey: number) => {
                // Parse **bold** and __underline__ recursively
                const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
                return parts.map((part, idx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={`${baseKey}-b-${idx}`}>{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('__') && part.endsWith('__')) {
                    return <u key={`${baseKey}-u-${idx}`}>{part.slice(2, -2)}</u>;
                  }
                  return part;
                });
              };

              lines.forEach((line, i) => {
                const trimmed = line.trim();
                
                if (trimmed.startsWith('### ')) {
                  flushList();
                  const content = trimmed.replace('### ', '');
                  elements.push(
                    <h4 key={i} style={{ color: 'var(--primary)', marginTop: elements.length === 0 ? 0 : 20, marginBottom: 12, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      {content}
                    </h4>
                  );
                } else if (trimmed.startsWith('- ')) {
                  const content = trimmed.replace('- ', '');
                  currentList.push(<li key={i} style={{ lineHeight: 1.6 }}>{parseInline(content, i)}</li>);
                } else {
                  flushList();
                  elements.push(<p key={i} style={{ lineHeight: 1.6, marginBottom: 12 }}>{parseInline(trimmed, i)}</p>);
                }
              });
              
              flushList();
              return elements;
            })()}
          </div>
          <div className="ai-summary-footer">
            {summary.editedSummary && <span className="badge badge-info">Edited by you</span>}
            {summary.status === 'fallback' && (
              <span className="badge badge-neutral" title="Built directly from structured records — AI model not used">
                Rule-based
              </span>
            )}
            {summary.status === 'insufficient' && <span className="badge badge-warning">Limited history</span>}
            {summary.sources.length > 0 && (
              <span className="ai-summary-sources">Sources: {summary.sources.join(' · ')}</span>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
