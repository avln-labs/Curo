import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { prescriptionsApi, API_BASE } from '../../../shared/api';

interface Prescription {
  id: string;
  serial_number: string;
  diagnosis: string | null;
  patient_name: string;
  slot_date: string;
  created_at: string;
}

export function PrescriptionPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const res = await prescriptionsApi.getMy();
      if (res.data?.success) {
        setPrescriptions(res.data.data);
      } else {
        setError('Failed to load prescriptions.');
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="page" style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <h1 className="page-title">Prescriptions</h1>
        <p className="page-subtitle">View and manage the digital prescriptions you have issued to patients.</p>
      </div>

      {error && <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Prescription History</h2>
          <Link to="/consultations" className="btn btn-primary btn-sm">Issue New Prescription</Link>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>
        ) : prescriptions.length === 0 ? (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <h2 style={{ marginBottom: 8 }}>No prescriptions yet</h2>
            <p className="text-muted text-sm" style={{ maxWidth: 440, margin: '0 auto' }}>
              You haven't issued any digital prescriptions. Start a consultation and use the prescription builder to issue one.
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Diagnosis</th>
                <th>Prescription ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((p) => (
                <tr key={p.id}>
                  <td className="text-sm font-medium">{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="text-sm">{p.patient_name}</td>
                  <td className="text-sm text-muted">{p.diagnosis || '—'}</td>
                  <td className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{p.serial_number}</td>
                  <td>
                    <a href={`${API_BASE}/prescriptions/${p.id}/pdf`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

