import { useState } from 'react';

const STATS = [
  { value: '2,847', label: 'Registered doctors',     note: '+12 this week' },
  { value: '18,421', label: 'Active patients',        note: '+341 this month' },
  { value: '₹4.2L', label: 'Platform revenue (MTD)',  note: '2.5% of transactions' },
  { value: '7', label: 'Pending verifications',       note: 'Action required' },
];

const QUEUE = [
  { id: 'v1', name: 'Dr. Meera Pillai',    specialty: 'Dermatology',      reg: 'KA-2018-32910', submitted: '9 Jun 2026', status: 'Pending' },
  { id: 'v2', name: 'Dr. Suresh Iyer',     specialty: 'Cardiology',       reg: 'TN-2015-10042', submitted: '8 Jun 2026', status: 'Pending' },
  { id: 'v3', name: 'Dr. Kavita Reddy',    specialty: 'Gynecology',       reg: 'AP-2020-55110', submitted: '8 Jun 2026', status: 'Pending' },
  { id: 'v4', name: 'Dr. Prakash Gupta',   specialty: 'Orthopedics',      reg: 'UP-2012-78831', submitted: '7 Jun 2026', status: 'Pending' },
  { id: 'v5', name: 'Dr. Ananya Thomas',   specialty: 'General Medicine', reg: 'KL-2019-23456', submitted: '7 Jun 2026', status: 'Pending' },
];

const RECENT_DOCTORS = [
  { id: 'd1', name: 'Dr. Arun Sharma',  specialty: 'General Medicine', patients: 148, revenue: '₹74,000', status: 'Verified',  since: 'Jan 2025' },
  { id: 'd2', name: 'Dr. Priya Nair',   specialty: 'Pediatrics',       patients: 92,  revenue: '₹46,000', status: 'Verified',  since: 'Mar 2025' },
  { id: 'd3', name: 'Dr. Rajesh Patel', specialty: 'ENT',              patients: 65,  revenue: '₹32,500', status: 'Suspended', since: 'Feb 2025' },
];

export function AdminPanel() {
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  function approve(id: string) { setApprovedIds((prev) => [...prev, id]); }
  function reject(id: string)  { setRejectedIds((prev) => [...prev, id]); }

  return (
    <main className="page">
      <div className="page-header">
        <h1 className="page-title">Admin Console</h1>
        <p className="page-subtitle">Platform operations · Doctor verification · Dispute management</p>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {STATS.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-value">{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Verification queue */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header">
          <h2 className="card-title">Verification queue</h2>
          <span className="badge badge-warning">{QUEUE.filter((q) => !approvedIds.includes(q.id) && !rejectedIds.includes(q.id)).length} pending</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Registration</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {QUEUE.map((item) => {
              const isApproved = approvedIds.includes(item.id);
              const isRejected = rejectedIds.includes(item.id);
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td className="text-sm">{item.specialty}</td>
                  <td className="mono text-xs">{item.reg}</td>
                  <td className="text-sm text-muted">{item.submitted}</td>
                  <td>
                    {isApproved ? <span className="badge badge-success">Verified ✓</span>
                     : isRejected ? <span className="badge badge-error">Rejected</span>
                     : <span className="badge badge-warning">Pending</span>}
                  </td>
                  <td>
                    {!isApproved && !isRejected && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => approve(item.id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => reject(item.id)}>Reject</button>
                        <button className="btn btn-ghost btn-sm">Review</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Doctor directory */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Doctor directory</h2>
          <input className="input" placeholder="Search by name or specialty…" style={{ width: 220 }} />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Patients</th>
              <th>Revenue (MTD)</th>
              <th>Verified since</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {RECENT_DOCTORS.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td className="text-sm">{d.specialty}</td>
                <td className="text-sm">{d.patients}</td>
                <td className="text-sm">{d.revenue}</td>
                <td className="text-sm text-muted">{d.since}</td>
                <td>
                  <span className={`badge ${d.status === 'Verified' ? 'badge-success' : 'badge-error'}`}>{d.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm">View</button>
                    {d.status === 'Verified' && <button className="btn btn-danger btn-sm">Suspend</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
