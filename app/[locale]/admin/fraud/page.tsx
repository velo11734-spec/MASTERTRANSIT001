'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  AlertTriangle, Search, RefreshCw, X, Eye, Shield,
  CheckCircle, Flag, ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FraudFlag {
  id: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  severity: string;
  status: string;
  notes: string | null;
  created_at: string;
  flagged_by: string | null;
}

const SEVERITY_COLOR: Record<string, { bg: string; color: string }> = {
  low:      { bg: '#DCFCE7', color: '#16A34A' },
  medium:   { bg: '#FEF9C3', color: '#CA8A04' },
  high:     { bg: '#FEF3C7', color: '#D97706' },
  critical: { bg: '#FEE2E2', color: '#DC2626' },
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  open:          { bg: '#DBEAFE', color: '#2563EB' },
  investigating: { bg: '#FEF9C3', color: '#CA8A04' },
  resolved:      { bg: '#DCFCE7', color: '#16A34A' },
  dismissed:     { bg: '#F3F4F6', color: '#6B7280' },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

async function logAudit(action: string, entityId: string, newValue: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      actor_id: user.id, actor_email: user.email,
      action, entity_type: 'fraud_flag', entity_id: entityId, new_value: newValue,
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
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  empty:   { textAlign: 'center' as const, padding: '60px 20px', color: '#475569' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:   { background: '#1E293B', borderRadius: '18px', padding: '32px', width: '500px', maxHeight: '85vh', overflowY: 'auto' as const, position: 'relative' as const, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' },
  label:   { fontSize: '12px', color: '#94A3B8', marginBottom: '6px', display: 'block', fontWeight: 600 },
};

export default function FraudPage() {
  const [flags, setFlags]     = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [selected, setSelected] = useState<FraudFlag | null>(null);
  const [notes, setNotes]     = useState('');
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving]   = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('fraud_flags')
        .select('*')
        .order('created_at', { ascending: false });
      setFlags(data ?? []);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = flags.filter(f => {
    const q = search.toLowerCase();
    const matchQ = !q || f.reason?.toLowerCase().includes(q) || f.entity_type?.toLowerCase().includes(q) || f.entity_id?.toLowerCase().includes(q);
    const matchSev = severityFilter === 'All' || f.severity === severityFilter;
    const matchSt  = statusFilter === 'All' || f.status === statusFilter;
    return matchQ && matchSev && matchSt;
  });

  const openFlag = (f: FraudFlag) => { setSelected(f); setNotes(f.notes ?? ''); };

  const handleUpdate = async (newStatus: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      await supabase.from('fraud_flags').update({ status: newStatus, notes, updated_at: new Date().toISOString() }).eq('id', selected.id);
      await logAudit('FRAUD_FLAG_UPDATED', selected.id, { status: newStatus, notes });
      showToast(`Flag marked as ${newStatus}`);
      setSelected(null);
      load();
    } catch (_) { showToast('Failed to update flag', false); } finally { setSaving(false); }
  };

  const stats = {
    critical: flags.filter(f => f.severity === 'critical' && f.status === 'open').length,
    high:     flags.filter(f => f.severity === 'high' && f.status === 'open').length,
    open:     flags.filter(f => f.status === 'open').length,
    resolved: flags.filter(f => f.status === 'resolved').length,
  };

  return (
    <div style={s.page}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}><AlertTriangle size={24} color="#F59E0B" /> Fraud Monitoring</h1>
        <button id="refresh-fraud-btn" onClick={load} style={{ ...s.actionBtn, padding: '10px 14px' }}><RefreshCw size={16} /></button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Critical Open', count: stats.critical, color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)' },
          { label: 'High Severity', count: stats.high,     color: '#D97706', bg: 'rgba(217,119,6,0.1)',  border: 'rgba(217,119,6,0.3)' },
          { label: 'Open Flags',   count: stats.open,     color: '#2563EB', bg: 'rgba(37,99,235,0.1)',  border: 'rgba(37,99,235,0.3)' },
          { label: 'Resolved',     count: stats.resolved,  color: '#16A34A', bg: 'rgba(22,163,74,0.1)',  border: 'rgba(22,163,74,0.3)' },
        ].map(st => (
          <div key={st.label} style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: '12px', padding: '18px 20px' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: st.color, margin: 0 }}>{st.count}</p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>{st.label}</p>
          </div>
        ))}
      </div>

      <div style={s.card}>
        {/* Filters */}
        <div style={s.row}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input id="fraud-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by entity, reason…" style={{ ...s.input, paddingLeft: '40px' }} />
          </div>
          <select id="fraud-severity-filter" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#F8FAFC', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {['All', 'critical', 'high', 'medium', 'low'].map(v => <option key={v} value={v}>{v === 'All' ? 'All Severities' : v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </select>
          <select id="fraud-status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#F8FAFC', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {['All', 'open', 'investigating', 'resolved', 'dismissed'].map(v => <option key={v} value={v}>{v === 'All' ? 'All Statuses' : v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={s.empty}><RefreshCw size={32} color="#334155" style={{ animation: 'spin 1s linear infinite' }} /><p style={{ marginTop: '12px' }}>Loading fraud flags…</p></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <Shield size={40} color="#334155" />
            <p style={{ marginTop: '12px', fontSize: '16px', fontWeight: 600 }}>No fraud flags found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>The platform is clean — no fraud activity detected yet.</p>
          </div>
        ) : (
          <div className="mt-table-wrap">
<table style={s.table}>
            <thead>
              <tr>
                {['Entity Type', 'Entity ID', 'Reason', 'Severity', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(flag => {
                const sevc = SEVERITY_COLOR[flag.severity] ?? { bg: '#1E293B', color: '#94A3B8' };
                const stc  = STATUS_COLOR[flag.status] ?? { bg: '#1E293B', color: '#94A3B8' };
                return (
                  <tr key={flag.id} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={s.td}><span style={{ textTransform: 'capitalize' as const }}>{flag.entity_type}</span></td>
                    <td style={s.td}><code style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>{flag.entity_id.slice(0, 12)}…</code></td>
                    <td style={{ ...s.td, maxWidth: '200px' }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{flag.reason}</span></td>
                    <td style={s.td}><span style={{ ...s.badge, background: sevc.bg, color: sevc.color }}>{flag.severity}</span></td>
                    <td style={s.td}><span style={{ ...s.badge, background: stc.bg, color: stc.color }}>{flag.status}</span></td>
                    <td style={s.td}>{fmtDate(flag.created_at)}</td>
                    <td style={s.td}>
                      <button id={`review-flag-${flag.id}`} onClick={() => openFlag(flag)} style={s.actionBtn}><Eye size={13} /> Review</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
</div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={s.modal}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flag size={20} color="#EF4444" />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>Fraud Flag Details</h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>{selected.id}</p>
              </div>
            </div>

            {[
              ['Entity Type', selected.entity_type],
              ['Entity ID', selected.entity_id],
              ['Reason', selected.reason],
              ['Severity', selected.severity],
              ['Current Status', selected.status],
              ['Flagged At', fmtDate(selected.created_at)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#64748B', fontSize: '13px' }}>{label}</span>
                <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '13px', textTransform: 'capitalize' as const }}>{val}</span>
              </div>
            ))}

            <div style={{ marginTop: '20px' }}>
              <label style={s.label}>Investigation Notes</label>
              <textarea
                id="fraud-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add investigation notes…"
                style={{ width: '100%', boxSizing: 'border-box' as const, background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#F8FAFC', fontSize: '13px', outline: 'none', resize: 'vertical' as const, fontFamily: 'Outfit, sans-serif' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' as const }}>
              {[
                { label: 'Investigate', status: 'investigating', color: '#CA8A04' },
                { label: 'Resolve', status: 'resolved', color: '#16A34A' },
                { label: 'Dismiss', status: 'dismissed', color: '#6B7280' },
              ].map(a => (
                <button key={a.status} id={`fraud-action-${a.status}`} onClick={() => handleUpdate(a.status)} disabled={saving || selected.status === a.status} style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', border: `1px solid ${a.color}30`, background: `${a.color}15`, color: a.color, fontWeight: 700, cursor: saving || selected.status === a.status ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: selected.status === a.status ? 0.5 : 1 }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
