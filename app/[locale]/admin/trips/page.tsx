'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Bus, Search, RefreshCw, X, Eye, CheckCircle,
  XCircle, Clock, Calendar, Users, MapPin,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Trip {
  id: string;
  route_id: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  status: string;
  available_seats: number | null;
  total_seats: number | null;
  price: number | null;
  created_at: string;
  route?: { origin: string; destination: string; name: string } | null;
  company?: { name: string } | null;
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  scheduled:  { bg: '#DBEAFE', color: '#2563EB' },
  boarding:   { bg: '#FEF9C3', color: '#CA8A04' },
  departed:   { bg: '#DCFCE7', color: '#16A34A' },
  arrived:    { bg: '#F0FDF4', color: '#15803D' },
  cancelled:  { bg: '#FEE2E2', color: '#DC2626' },
  delayed:    { bg: '#FEF3C7', color: '#D97706' },
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtTime = (d: string | null) =>
  d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtNGN = (n: number | null) =>
  n != null ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n) : '—';

async function logAudit(action: string, entityId: string, newValue: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      actor_id: user.id, actor_email: user.email,
      action, entity_type: 'trip', entity_id: entityId, new_value: newValue,
    });
  } catch (_) {}
}

const s: Record<string, React.CSSProperties> = {
  page:    { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  title:   { fontSize: '26px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  card:    { background: '#1E293B', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  row:     { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
  input:   { flex: 1, background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 16px', color: '#F8FAFC', fontSize: '14px', outline: 'none' },
  table:   { width: '100%', borderCollapse: 'collapse' as const },
  th:      { textAlign: 'left' as const, padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '1px', borderBottom: '1px solid #334155' },
  td:      { padding: '14px', fontSize: '13.5px', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  badge:   { borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  empty:   { textAlign: 'center' as const, padding: '60px 20px', color: '#475569' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:   { background: '#1E293B', borderRadius: '18px', padding: '32px', width: '500px', maxHeight: '85vh', overflowY: 'auto' as const, position: 'relative' as const, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' },
};

const STATUSES = ['All', 'scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'];

export default function TripsPage() {
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState<Trip | null>(null);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('trips')
        .select('*, route:routes(origin,destination,name), company:companies(name)')
        .order('departure_time', { ascending: false });
      setTrips(data ?? []);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = trips.filter(t => {
    const q = search.toLowerCase();
    const route = t.route;
    const matchQ = !q || route?.name?.toLowerCase().includes(q) || route?.origin?.toLowerCase().includes(q) || route?.destination?.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || t.status === statusFilter;
    return matchQ && matchS;
  });

  const handleStatusChange = async (trip: Trip, newStatus: string) => {
    try {
      await supabase.from('trips').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', trip.id);
      await logAudit('TRIP_STATUS_CHANGED', trip.id, { status: newStatus });
      showToast(`Trip status updated to ${newStatus}`);
      setSelected(null);
      load();
    } catch (_) { showToast('Failed to update trip status', false); }
  };

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}><Bus size={24} color="#16A34A" /> Trip Management</h1>
        <button id="refresh-trips-btn" onClick={load} style={{ ...s.actionBtn, padding: '10px 14px' }}><RefreshCw size={16} /></button>
      </div>

      {/* Stat Chips */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
        {['scheduled', 'boarding', 'departed', 'cancelled'].map(st => {
          const count = trips.filter(t => t.status === st).length;
          const sc = STATUS_COLOR[st] ?? { bg: '#1E293B', color: '#94A3B8' };
          return (
            <div key={st} onClick={() => setStatusFilter(statusFilter === st ? 'All' : st)} style={{ background: '#1E293B', border: `1px solid ${statusFilter === st ? sc.color : '#334155'}`, borderRadius: '10px', padding: '12px 18px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: sc.color }}>{count}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', textTransform: 'capitalize' as const }}>{st}</p>
            </div>
          );
        })}
      </div>

      <div style={s.card}>
        {/* Filters */}
        <div style={s.row}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input id="trips-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by route or city…" style={{ ...s.input, paddingLeft: '40px' }} />
          </div>
          <select id="trips-status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#F8FAFC', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={s.empty}><RefreshCw size={32} color="#334155" style={{ animation: 'spin 1s linear infinite' }} /><p style={{ marginTop: '12px' }}>Loading trips…</p></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <Bus size={40} color="#334155" />
            <p style={{ marginTop: '12px', fontSize: '16px', fontWeight: 600 }}>No trips found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Trips will appear here once transport companies add their schedules.</p>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Route', 'Company', 'Departure', 'Arrival', 'Seats', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(trip => {
                const sc = STATUS_COLOR[trip.status] ?? { bg: '#1E293B', color: '#94A3B8' };
                const route = trip.route;
                return (
                  <tr key={trip.id} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '13px' }}>
                        {route ? `${route.origin} → ${route.destination}` : '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{route?.name ?? ''}</div>
                    </td>
                    <td style={s.td}>{trip.company?.name ?? <span style={{ color: '#475569' }}>—</span>}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#16A34A" />
                        <span>{fmtDate(trip.departure_time)}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{fmtTime(trip.departure_time)}</div>
                    </td>
                    <td style={s.td}>{fmtTime(trip.arrival_time)}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={13} color="#94A3B8" />
                        <span>{trip.available_seats ?? '—'} / {trip.total_seats ?? '—'}</span>
                      </div>
                    </td>
                    <td style={s.td}>{fmtNGN(trip.price)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{trip.status}</span>
                    </td>
                    <td style={s.td}>
                      <button id={`view-trip-${trip.id}`} onClick={() => setSelected(trip)} style={s.actionBtn}><Eye size={13} /> View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={s.modal}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: '#F8FAFC' }}>
              {selected.route ? `${selected.route.origin} → ${selected.route.destination}` : 'Trip Details'}
            </h2>
            <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '24px' }}>ID: {selected.id}</p>

            {[
              ['Route Name', selected.route?.name ?? '—'],
              ['Company', selected.company?.name ?? '—'],
              ['Departure', `${fmtDate(selected.departure_time)} at ${fmtTime(selected.departure_time)}`],
              ['Arrival', fmtTime(selected.arrival_time)],
              ['Seats Available', `${selected.available_seats ?? '—'} / ${selected.total_seats ?? '—'}`],
              ['Price', fmtNGN(selected.price)],
              ['Status', selected.status],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#64748B', fontSize: '13px' }}>{label}</span>
                <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '13px' }}>{val}</span>
              </div>
            ))}

            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Update Status</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                {['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'].map(st => {
                  const sc = STATUS_COLOR[st] ?? { bg: '#1E293B', color: '#94A3B8' };
                  const isCurrent = selected.status === st;
                  return (
                    <button key={st} id={`trip-status-${st}`} onClick={() => handleStatusChange(selected, st)} disabled={isCurrent} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${isCurrent ? sc.color : 'rgba(255,255,255,0.1)'}`, cursor: isCurrent ? 'default' : 'pointer', background: isCurrent ? sc.bg : 'transparent', color: isCurrent ? sc.color : '#94A3B8', fontSize: '12px', fontWeight: 600, opacity: isCurrent ? 1 : 0.8, textTransform: 'capitalize' as const }}>
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
