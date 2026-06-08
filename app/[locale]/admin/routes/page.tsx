'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Route, Search, Plus, X, RefreshCw, Edit2,
  Trash2, CheckCircle, XCircle, Clock, MapPin,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RouteRow {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number | null;
  duration_minutes: number | null;
  status: string;
  price_range_min: number | null;
  price_range_max: number | null;
  is_popular: boolean;
  created_at: string;
}

type Toast = { msg: string; ok: boolean };

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  active:   { bg: '#DCFCE7', color: '#16A34A' },
  inactive: { bg: '#F3F4F6', color: '#6B7280' },
  pending:  { bg: '#FEF9C3', color: '#CA8A04' },
};

const fmtNGN = (n: number | null) =>
  n != null ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n) : '—';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

async function logAudit(action: string, entityId: string, newValue: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      actor_id: user.id, actor_email: user.email,
      action, entity_type: 'route', entity_id: entityId, new_value: newValue,
    });
  } catch (_) {}
}

const s: Record<string, React.CSSProperties> = {
  page:    { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  title:   { fontSize: '26px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  card:    { background: '#1E293B', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  addBtn:  { background: '#16A34A', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px' },
  row:     { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
  input:   { flex: 1, background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 16px', color: '#F8FAFC', fontSize: '14px', outline: 'none' },
  table:   { width: '100%', borderCollapse: 'collapse' as const },
  th:      { textAlign: 'left' as const, padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '1px', borderBottom: '1px solid #334155' },
  td:      { padding: '14px', fontSize: '13.5px', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  badge:   { borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center' },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:   { background: '#1E293B', borderRadius: '18px', padding: '32px', width: '540px', maxHeight: '90vh', overflowY: 'auto' as const, position: 'relative' as const, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' },
  label:   { fontSize: '12px', color: '#94A3B8', marginBottom: '6px', display: 'block', fontWeight: 600 },
  formInput: { width: '100%', boxSizing: 'border-box' as const, background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#F8FAFC', fontSize: '14px', outline: 'none', marginBottom: '16px' },
  saveBtn: { background: '#16A34A', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
  empty:   { textAlign: 'center' as const, padding: '60px 20px', color: '#475569' },
};

const EMPTY_FORM = {
  name: '', origin: '', destination: '',
  distance_km: '', duration_minutes: '',
  status: 'active', price_range_min: '', price_range_max: '',
  is_popular: false,
};

export default function RoutesPage() {
  const [routes, setRoutes]   = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast]     = useState<Toast | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RouteRow | null>(null);
  const [form, setForm]       = useState({ ...EMPTY_FORM });
  const [saving, setSaving]   = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });
      setRoutes(data ?? []);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = routes.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.name?.toLowerCase().includes(q) || r.origin?.toLowerCase().includes(q) || r.destination?.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || r.status === statusFilter;
    return matchQ && matchS;
  });

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };
  const openEdit   = (r: RouteRow) => {
    setEditing(r);
    setForm({
      name: r.name ?? '', origin: r.origin ?? '', destination: r.destination ?? '',
      distance_km: r.distance_km?.toString() ?? '', duration_minutes: r.duration_minutes?.toString() ?? '',
      status: r.status ?? 'active',
      price_range_min: r.price_range_min?.toString() ?? '', price_range_max: r.price_range_max?.toString() ?? '',
      is_popular: r.is_popular ?? false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.origin || !form.destination) { showToast('Name, origin and destination are required', false); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), origin: form.origin.trim(), destination: form.destination.trim(),
        distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        status: form.status,
        price_range_min: form.price_range_min ? parseFloat(form.price_range_min) : null,
        price_range_max: form.price_range_max ? parseFloat(form.price_range_max) : null,
        is_popular: form.is_popular,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        await supabase.from('routes').update(payload).eq('id', editing.id);
        await logAudit('ROUTE_UPDATED', editing.id, payload);
        showToast('Route updated successfully');
      } else {
        const { data } = await supabase.from('routes').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        await logAudit('ROUTE_CREATED', data?.id ?? '', payload);
        showToast('Route created successfully');
      }
      setShowModal(false);
      load();
    } catch (_) { showToast('Failed to save route', false); } finally { setSaving(false); }
  };

  const handleDelete = async (r: RouteRow) => {
    if (!confirm(`Delete route "${r.name}"? This cannot be undone.`)) return;
    try {
      await supabase.from('routes').delete().eq('id', r.id);
      await logAudit('ROUTE_DELETED', r.id, { name: r.name });
      showToast('Route deleted');
      load();
    } catch (_) { showToast('Failed to delete route', false); }
  };

  const handleStatusToggle = async (r: RouteRow) => {
    const next = r.status === 'active' ? 'inactive' : 'active';
    try {
      await supabase.from('routes').update({ status: next, updated_at: new Date().toISOString() }).eq('id', r.id);
      await logAudit('ROUTE_STATUS_CHANGED', r.id, { status: next });
      showToast(`Route ${next === 'active' ? 'activated' : 'deactivated'}`);
      load();
    } catch (_) { showToast('Failed to update status', false); }
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
        <h1 style={s.title}><Route size={24} color="#16A34A" /> Route Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button id="refresh-routes-btn" onClick={load} style={{ ...s.actionBtn, padding: '10px 14px' }}><RefreshCw size={16} /></button>
          <button id="create-route-btn" onClick={openCreate} style={s.addBtn}><Plus size={16} /> Add Route</button>
        </div>
      </div>

      {/* Filters */}
      <div style={s.card}>
        <div style={s.row}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input id="routes-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search routes…" style={{ ...s.input, paddingLeft: '40px' }} />
          </div>
          {['All', 'active', 'inactive', 'pending'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: statusFilter === f ? '#16A34A' : '#0F172A', color: statusFilter === f ? '#fff' : '#94A3B8' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={s.empty}><RefreshCw size={32} color="#334155" style={{ animation: 'spin 1s linear infinite' }} /><p style={{ marginTop: '12px' }}>Loading routes…</p></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <Route size={40} color="#334155" />
            <p style={{ marginTop: '12px', fontSize: '16px', fontWeight: 600 }}>No routes found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Add your first route to get started.</p>
          </div>
        ) : (
          <div className="mt-table-wrap">
<table style={s.table}>
            <thead>
              <tr>
                {['Route Name', 'Origin → Destination', 'Distance', 'Duration', 'Price Range', 'Status', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const sc = STATUS_COLOR[r.status] ?? { bg: '#1E293B', color: '#94A3B8' };
                return (
                  <tr key={r.id} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{r.name}</div>
                      {r.is_popular && <span style={{ fontSize: '10px', color: '#FBBF24', fontWeight: 700 }}>★ Popular</span>}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} color="#16A34A" />
                        <span>{r.origin} → {r.destination}</span>
                      </div>
                    </td>
                    <td style={s.td}>{r.distance_km != null ? `${r.distance_km} km` : '—'}</td>
                    <td style={s.td}>{r.duration_minutes != null ? `${Math.floor(r.duration_minutes / 60)}h ${r.duration_minutes % 60}m` : '—'}</td>
                    <td style={s.td}>
                      {r.price_range_min != null && r.price_range_max != null
                        ? `${fmtNGN(r.price_range_min)} – ${fmtNGN(r.price_range_max)}`
                        : '—'}
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{r.status}</span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button id={`edit-route-${r.id}`} onClick={() => openEdit(r)} style={s.actionBtn}><Edit2 size={13} /></button>
                        <button id={`toggle-route-${r.id}`} onClick={() => handleStatusToggle(r)} style={{ ...s.actionBtn, color: r.status === 'active' ? '#F59E0B' : '#16A34A' }} title={r.status === 'active' ? 'Deactivate' : 'Activate'}>
                          {r.status === 'active' ? <XCircle size={13} /> : <CheckCircle size={13} />}
                        </button>
                        <button id={`delete-route-${r.id}`} onClick={() => handleDelete(r)} style={{ ...s.actionBtn, color: '#EF4444' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={s.modal}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#F8FAFC' }}>{editing ? 'Edit Route' : 'Add New Route'}</h2>

            <label style={s.label}>Route Name *</label>
            <input id="route-form-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lagos – Abuja Express" style={s.formInput} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={s.label}>Origin *</label>
                <input id="route-form-origin" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} placeholder="Departure city" style={{ ...s.formInput, marginBottom: 0 }} />
              </div>
              <div>
                <label style={s.label}>Destination *</label>
                <input id="route-form-dest" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Arrival city" style={{ ...s.formInput, marginBottom: 0 }} />
              </div>
            </div>

            <div style={{ height: '16px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={s.label}>Distance (km)</label>
                <input id="route-form-distance" type="number" value={form.distance_km} onChange={e => setForm({ ...form, distance_km: e.target.value })} placeholder="e.g. 850" style={{ ...s.formInput, marginBottom: 0 }} />
              </div>
              <div>
                <label style={s.label}>Duration (minutes)</label>
                <input id="route-form-duration" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} placeholder="e.g. 390" style={{ ...s.formInput, marginBottom: 0 }} />
              </div>
            </div>

            <div style={{ height: '16px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={s.label}>Min Price (NGN)</label>
                <input id="route-form-min" type="number" value={form.price_range_min} onChange={e => setForm({ ...form, price_range_min: e.target.value })} placeholder="e.g. 5000" style={{ ...s.formInput, marginBottom: 0 }} />
              </div>
              <div>
                <label style={s.label}>Max Price (NGN)</label>
                <input id="route-form-max" type="number" value={form.price_range_max} onChange={e => setForm({ ...form, price_range_max: e.target.value })} placeholder="e.g. 15000" style={{ ...s.formInput, marginBottom: 0 }} />
              </div>
            </div>

            <div style={{ height: '16px' }} />

            <label style={s.label}>Status</label>
            <select id="route-form-status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...s.formInput, cursor: 'pointer' }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <input id="route-form-popular" type="checkbox" checked={form.is_popular} onChange={e => setForm({ ...form, is_popular: e.target.checked })} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="route-form-popular" style={{ ...s.label, marginBottom: 0, cursor: 'pointer' }}>Mark as Popular Route</label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ background: '#0F172A', color: '#94A3B8', border: '1px solid #334155', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button id="route-save-btn" onClick={handleSave} disabled={saving} style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : editing ? 'Update Route' : 'Create Route'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
