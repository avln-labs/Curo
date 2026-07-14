import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi, doctorApi } from '../../../shared/api';

interface DoctorSearchResult {
  id: string;
  slug: string;
  full_name: string;
  qualifications: string[];
  specialisations: string[];
  city: string;
  clinic_name: string;
  starting_fee: string;
}

export function DoctorSearchPage() {
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [lastConsulted, setLastConsulted] = useState<DoctorSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [docsRes, recordsRes] = await Promise.all([
          doctorApi.search(),
          patientApi.getMyRecords()
        ]);
        
        let allDoctors: DoctorSearchResult[] = [];
        if (docsRes.data?.success) {
          allDoctors = docsRes.data.data;
          setDoctors(allDoctors);
        }

        // Find last consulted doctor
        const recordsData = recordsRes.data?.data as any;
        if (recordsRes.data?.success && recordsData?.appointments?.length > 0) {
          const pastAppts = recordsData.appointments;
          // Sort by date descending to find the most recent
          pastAppts.sort((a: any, b: any) => new Date(b.slot_date).getTime() - new Date(a.slot_date).getTime());
          
          const mostRecentDocSlug = pastAppts[0].doctor_slug;
          const found = allDoctors.find(d => d.slug === mostRecentDocSlug);
          if (found) {
            setLastConsulted(found);
          }
        }
      } catch (err) {
        console.error('Failed to load doctors', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!searchQuery) return doctors;
    const q = searchQuery.toLowerCase();
    return doctors.filter(d => 
      d.full_name.toLowerCase().includes(q) || 
      d.specialisations.some(s => s.toLowerCase().includes(q))
    );
  }, [doctors, searchQuery]);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Finding available doctors...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', overflowY: 'auto' }}>
      {/* Header and Search */}
      <div style={{ background: 'var(--surface)', padding: '24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Directory</p>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Book a Consultation</h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>🔍</span>
          </div>
          <input 
            type="text" 
            placeholder="Search doctors, specialties..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem' }} 
          />
        </div>
      </div>
      
      <div style={{ padding: '24px' }}>
        
        {/* Top Specialties */}
        {!searchQuery && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Top Specialties</h3>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, margin: '0 -8px', padding: '0 8px' }}>
              {[
                { name: 'General', icon: '🩺', bg: '#EFF6FF' },
                { name: 'Pediatrics', icon: '👶', bg: '#FFFBEB' },
                { name: 'Cardiology', icon: '❤️', bg: '#FFF1F2' },
                { name: 'Skin', icon: '✨', bg: '#FAF5FF' },
              ].map(cat => (
                <div key={cat.name} onClick={() => setSearchQuery(cat.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  <div style={{ width: 56, height: 56, background: cat.bg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 8, border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-sm)' }}>
                    {cat.icon}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Consulted */}
        {!searchQuery && lastConsulted && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Last Consulted</h3>
            <div 
              onClick={() => navigate(`/dr/${lastConsulted.slug}`)}
              style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              className="hover-card"
            >
              <div style={{ display: 'flex', marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, background: 'var(--primary-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold', marginRight: 12, border: '1px solid var(--primary)' }}>
                  {lastConsulted.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {lastConsulted.full_name}</h4>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lastConsulted.specialisations.join(', ')}</p>
                </div>
              </div>
              <div style={{ background: 'var(--background)', borderRadius: 'var(--radius)', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Book Follow-up
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{lastConsulted.starting_fee}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Available Near You / Search Results */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            {searchQuery ? 'Search Results' : 'Available Near You'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredDoctors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                No doctors found matching your criteria.
              </div>
            ) : (
              filteredDoctors.map((doc, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate(`/dr/${doc.slug}`)}
                  style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 'bold', marginRight: 12, border: '1px solid var(--border)', fontSize: '1.2rem' }}>
                      {doc.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {doc.full_name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)', background: 'var(--background)', padding: '2px 6px', borderRadius: 4 }}>
                          ⭐ 4.9
                        </div>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.specialisations.join(', ')}</p>
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--background)', borderRadius: 'var(--radius)', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 4 }}>📅</span> View Slots
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{doc.starting_fee}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .hover-card { transition: border-color 0.2s, transform 0.2s; }
        .hover-card:hover { border-color: var(--primary); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
