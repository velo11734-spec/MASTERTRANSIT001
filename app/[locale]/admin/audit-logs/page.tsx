'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  ClipboardList, Search, RefreshCw, Eye, X,
  Filter, Download,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

const ACTION_COLOR: Record<string, string> = {
  CREATE:  '#16A34A',
  CREATED: '#16A34A',
  UPDATE:  '#2563EB',
  UPDATED: '#2563EB',
  DELETE:  '#DC2626',
  DELETED: '#DC2626',
  SUSPEND: '#D97706',
  RESTORE: '#16A34A',
  APPROVE: '#16A34A',
  REJECT:  '#DC2626',
  LOGIN:   '#8B5CF6',
  TOGGLE:  '#EC4899',
  EMERGENCY: '#DC2626',
  STATUS: '#2563EB',
};

function getActionColor(action: string) {
  for (const [prefix, color] of Object.entries(ACTION_COLOR)) {
    if (action.toUpperCase().includes(prefix)) return color;
  }
  return '#64748B';
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
  td:      { padding: '12px 14px', fontSize: '13px', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'top' as const },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  empty:   { textAlign: 'center' as const, padding: '60px 20px', color: '#475569' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:   { background: '#1E293B', borderRadius: '18px', padding: '32px', width: '560px', maxHeight: '85vh', overflowY: 'auto' as const, position: 'relative' as const, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' },
};

const ENTITY_TYPES = ['All', 'user', 'company', 'route', 'trip', 'booking', 'payment', 'dispute', 'platform_setting', 'fraud_flag'];
const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [page, setPage]           = useState(0);
  const [selected, setSelected]   = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (entityFilter !== 'All') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data, count } = await query;
      setLogs(data ?? []);
      setTotal(count ?? 0);
    } catch (_) {} finally { setLoading(false); }
  }, [page, entityFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? logs.filter(l => {
        const q = search.toLowerCase();
        return (
          l.action?.toLowerCase().includes(q) ||
          l.actor_email?.toLowerCase().includes(q) ||
          l.entity_type?.toLowerCase().includes(q) ||
          l.entity_id?.toLowerCase().includes(q)
        );
      })
    : logs;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportCSV = () => {
    const rows = [
      ['ID', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Date'],
      ...filtered.map(l => [l.id, l.actor_email ?? '', l.action, l.entity_type ?? '', l.entity_id ?? '', fmtDate(l.created_at)]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}><ClipboardList size={24} color="#16A34A" /> Audit Logs</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button id="export-audit-btn" onClick={exportCSV} style={{ ...s.actionBtn, padding: '10px 16px', color: '#16A34A', border: '1px solid rgba(22,163,74,0.3)' }}>
            <Download size={15} /> Export CSV
          </button>
          <button id="refresh-audit-btn" onClick={load} style={{ ...s.actionBtn, padding: '10px 14px' }}><RefreshCw size={16} /></button>
        </div>
      </div>

      <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '24px' }}>
        Immutable record of all admin and system actions. {total.toLocaleString()} total entries.
      </p>

      <div style={s.card}>
        {/* Filters */}
        <div style={s.row}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input id="audit-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by actor, action, entity…" style={{ ...s.input, paddingLeft: '40px' }} />
          </div>
          <select id="audit-entity-filter" value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(0); }} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#F8FAFC', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Entity Types' : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={s.empty}><RefreshCw size={32} color="#334155" style={{ animation: 'spin 1s linear infinite' }} /><p style={{ marginTop: '12px' }}>Loading audit logs…</p></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <ClipboardList size={40} color="#334155" />
            <p style={{ marginTop: '12px', fontSize: '16px', fontWeight: 600 }}>No audit logs found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>All admin actions will be permanently recorded here.</p>
          </div>
        ) : (
          <>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Details'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const acolor = getActionColor(log.action);
                  return (
                    <tr key={log.id} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ ...s.td, whiteSpace: 'nowrap' as const, fontSize: '12px', color: '#64748B' }}>
                        {fmtDate(log.created_at)}
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>{log.actor_email ?? <span style={{ color: '#475569' }}>System</span>}</div>
                      </td>
                      <td style={s.td}>
                        <code style={{ fontSize: '11px', background: `${acolor}15`, color: acolor, padding: '3px 8px', borderRadius: '5px', fontWeight: 700 }}>
                          {log.action}
                        </code>
                      </td>
                      <td style={s.td}>
                        {log.entity_type && (
                          <div>
                            <span style={{ color: '#94A3B8', textTransform: 'capitalize' as const }}>{log.entity_type}</span>
                            {log.entity_id && <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{log.entity_id.length > 16 ? log.entity_id.slice(0, 16) + '…' : log.entity_id}</div>}
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <button id={`audit-view-${log.id}`} onClick={() => setSelected(log)} style={s.actionBtn}><Eye size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                <button id="audit-prev-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...s.actionBtn, opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                <span style={{ color: '#64748B', fontSize: '13px' }}>Page {page + 1} of {totalPages}</span>
                <button id="audit-next-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ ...s.actionBtn, opacity: page >= totalPages - 1 ? 0.4 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={s.modal}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: '#F8FAFC' }}>Audit Entry</h2>
            <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '20px' }}>{selected.id}</p>

            {[
              ['Timestamp', fmtDate(selected.created_at)],
              ['Actor Email', selected.actor_email ?? 'System'],
              ['Actor ID', selected.actor_id ?? '—'],
              ['Action', selected.action],
              ['Entity Type', selected.entity_type ?? '—'],
              ['Entity ID', selected.entity_id ?? '—'],
              ['IP Address', selected.ip_address ?? '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#64748B', fontSize: '12px' }}>{label}</span>
                <span style={{ color: '#F1F5F9', fontWeight: 500, fontSize: '12px', maxWidth: '280px', textAlign: 'right' as const, wordBreak: 'break-all' as const }}>{val}</span>
              </div>
            ))}

            {selected.old_value && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, marginBottom: '6px' }}>OLD VALUE</p>
                <pre style={{ background: '#0F172A', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#EF4444', overflow: 'auto', margin: 0, maxHeight: '100px' }}>{JSON.stringify(selected.old_value, null, 2)}</pre>
              </div>
            )}
            {selected.new_value && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, marginBottom: '6px' }}>NEW VALUE</p>
                <pre style={{ background: '#0F172A', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#22C55E', overflow: 'auto', margin: 0, maxHeight: '100px' }}>{JSON.stringify(selected.new_value, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
