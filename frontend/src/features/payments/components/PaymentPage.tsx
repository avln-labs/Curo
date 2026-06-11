import { useState } from 'react';

const PAYOUTS = [
  { id: 'py1', date: '8 Jun 2026',  amount: '₹3,200', appointments: 8,  status: 'Settled',  ref: 'RAZX-73821' },
  { id: 'py2', date: '6 Jun 2026',  amount: '₹2,800', appointments: 7,  status: 'Settled',  ref: 'RAZX-71590' },
  { id: 'py3', date: '4 Jun 2026',  amount: '₹4,500', appointments: 11, status: 'Settled',  ref: 'RAZX-69403' },
  { id: 'py4', date: '2 Jun 2026',  amount: '₹1,900', appointments: 5,  status: 'Settled',  ref: 'RAZX-67218' },
  { id: 'py5', date: '9 Jun 2026',  amount: '₹5,600', appointments: 8,  status: 'Pending',  ref: 'RAZX-75100' },
];

export function PaymentPage() {
  const [simResult, setSimResult] = useState<'success' | 'failure' | null>(null);

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Payments & Payouts</h1>
        <p className="page-subtitle">Dr. Arun Sharma · T+2 settlement · 2.5% platform fee</p>
      </div>

      {/* Stats */}
      <div className="stats-strip" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="stat-item">
          <div className="stat-value">₹18,000</div>
          <div className="stat-label">Total this month</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">₹5,600</div>
          <div className="stat-label">Today's collection</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">₹450</div>
          <div className="stat-label">Platform fees (MTD)</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">₹17,550</div>
          <div className="stat-label">Net payouts (MTD)</div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Payout history */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Payout history</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Appointments</th>
                <th>Status</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUTS.map((p) => (
                <tr key={p.id}>
                  <td className="text-sm">{p.date}</td>
                  <td style={{ fontWeight: 600 }}>{p.amount}</td>
                  <td className="text-sm">{p.appointments}</td>
                  <td>
                    <span className={`badge ${p.status === 'Settled' ? 'badge-success' : 'badge-warning'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="mono text-xs text-muted">{p.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Razorpay mock */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Simulate Razorpay checkout</h2>
            </div>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              Demo: simulate a patient payment for an online consultation.
            </p>

            <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 'var(--space-3)', marginBottom: 16 }}>
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span className="text-sm font-medium">Online consultation — Dr. Arun Sharma</span>
              </div>
              {[
                { label: 'Consultation fee', value: '₹500' },
                { label: 'Platform fee', value: '₹13' },
              ].map((r) => (
                <div key={r.label} className="flex-between" style={{ fontSize: '0.875rem', padding: '3px 0' }}>
                  <span className="text-muted">{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="flex-between" style={{ fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>₹513</span>
              </div>
            </div>

            {simResult === null && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setSimResult('success')}>
                  Pay ₹513 (success)
                </button>
                <button className="btn btn-secondary" onClick={() => setSimResult('failure')}>
                  Simulate failure
                </button>
              </div>
            )}

            {simResult === 'success' && (
              <div className="notice notice-success">
                <div>
                  <strong>Payment captured ✓</strong>
                  <div className="text-sm" style={{ marginTop: 4 }}>Booking confirmed. Reference: RAZPAY-{Math.random().toString(36).substring(2, 9).toUpperCase()}</div>
                </div>
                <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setSimResult(null)}>Reset</button>
              </div>
            )}

            {simResult === 'failure' && (
              <div className="notice notice-error">
                <div>
                  <strong>Payment failed</strong>
                  <div className="text-sm" style={{ marginTop: 4 }}>Bank declined the transaction. Slot released. Please retry.</div>
                </div>
                <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setSimResult(null)}>Retry</button>
              </div>
            )}
          </div>

          <div className="card mt-3">
            <h2 className="card-title" style={{ marginBottom: 12 }}>Bank account details</h2>
            {[
              { label: 'Account number', value: '••••••••3821' },
              { label: 'IFSC', value: 'HDFC0001234' },
              { label: 'PAN', value: 'AXXPS1234Z' },
              { label: 'Settlement cycle', value: 'T+2 business days' },
            ].map((r) => (
              <div key={r.label} className="flex-between" style={{ fontSize: '0.875rem', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">{r.label}</span>
                <span className="mono font-medium">{r.value}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Update bank details</button>
          </div>
        </div>
      </div>
    </main>
  );
}
