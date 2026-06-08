'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MapPin, ChevronRight, Plus, Pencil, Power, Loader2, RefreshCw, X, Check } from 'lucide-react';

type Terminal = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  operating_hours: string | null;
  status: string | null;
  created_at: string | null;
};

type Toast = { message: string; type: 'success' | 'error' };

const emptyForm = { name: '', city: '', state: '', country: 'Nigeria', address: '', operating_hours: '', status: 'active' };

const s: Record<string, React.CSSProperties> = {
  page: { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  bc: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8', marginBottom: 24 },
  bcLink: { color: '#16A34A', cursor: 'pointer' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 10 },
  card: { background: '#1E293B', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: 1, borderBottom: '1px solid #334155' },
  btn: { padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 6, display: 'inline-flex', alignItems: 'center', gap: 4 },
  addBtn: { background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1E293B', borderRadius: 18, padding: 32, width: 520, maxHeight: '88vh', overflowY: 'auto' as const, position: 'relative' as const, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' },
  modalTitle: { fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#F8FAFC' },
  closeBtn: { position: 'absolute' as const, top: 16, right: 16, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 5, display: 'block', fontWeight: 600 },
  input: { width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box' as const },
  select: { width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box' as const },
  saveBtn: { background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 },
  empty: { textAlign: 'center' as const, padding: '60px 20px', color: '#475569' },
};

async function logAudit(action: string, entityType: string, entityId: string, newValue: object) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('audit_logs').insert({ actor_id: user.id, actor_email: user.email, action, entity_type: entityType, entity_id: entityId, new_value: newValue });
}

export default function AdminTerminalsPage() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Terminal | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('terminals').select('*').order('created_at', { ascending: false });
    if (error) showToast('Failed to load terminals', 'error');
    else setTerminals(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEdit = (t: Terminal) => {
    setEditing(t);
    setForm({ name: t.name || '', city: t.city || '', state: t.state || '', country: t.country || 'Nigeria', address: t.address || '', operating_hours: t.operating_hours || '', status: t.status || 'active' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.city || !form.state) { showToast('Name, city, and state are required', 'error'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('terminals').update(form).eq('id', editing.id);
      if (error) showToast('Failed to update terminal', 'error');
      else { await logAudit('UPDATE_TERMINAL', 'terminal', editing.id, form); showToast('Terminal updated', 'success'); setShowModal(false); fetch(); }
    } else {
      const { data, error } = await supabase.from('terminals').insert(form).select().single();
      if (error) showToast('Failed to create terminal', 'error');
      else { await logAudit('CREATE_TERMINAL', 'terminal', data.id, form); showToast('Terminal created', 'success'); setShowModal(false); fetch(); }
    }
    setSaving(false);
  };

  const handleDisable = async (t: Terminal) => {
    const newStatus = t.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('terminals').update({ status: newStatus }).eq('id', t.id);
    if (error) showToast('Failed to update status', 'error');
    else { await logAudit('TOGGLE_TERMINAL_STATUS', 'terminal', t.id, { status: newStatus }); showToast(`Terminal ${newStatus}`, 'success'); fetch(); }
  };

  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === 'success' ? '#16A34A' : '#DC2626', color: '#fff',
          padding: '12px 22px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          {toast.message}
        </div>
      )}

      <div style={s.bc}><span style={s.bcLink}>Admin</span><ChevronRight size={14} /><span>Terminal Management</span></div>

      <div style={s.header}>
        <div style={s.title}><MapPin size={26} color="#16A34A" /> Terminal Management</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetch} style={{ padding: '10px 16px', background: '#0F172A', border: '1px solid #334155', color: '#94A3B8', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <RefreshCw size={14} style={{ display: 'inline', marginRight: 6 }} />Refresh
          </button>
          <button onClick={openAdd} style={s.addBtn}><Plus size={16} />Add Terminal</button>
        </div>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={s.empty}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#16A34A', margin: '0 auto 12px', display: 'block' }} />Loading terminals...</div>
        ) : terminals.length === 0 ? (
          <div style={s.empty}><MapPin size={40} style={{ display: 'block', margin: '0 auto 12px', color: '#334155' }} /><div style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8' }}>No terminals yet</div><div style={{ fontSize: 13, marginTop: 8 }}><button onClick={openAdd} style={{ ...s.addBtn, margin: '0 auto' }}>Add your first terminal</button></div></div>
        ) : (
          <div className="mt-table-wrap">
<table style={s.table}>
            <thead><tr>{['Name', 'City', 'State', 'Country', 'Hours', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {terminals.map(t => (
                <tr key={t.id}>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #334155', verticalAlign: 'middle' }}><span style={{ fontWeight: 600, color: '#E2E8F0' }}>{t.name}</span></td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #334155', verticalAlign: 'middle', color: '#CBD5E1' }}>{t.city}</td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #334155', verticalAlign: 'middle', color: '#94A3B8' }}>{t.state}</td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #334155', verticalAlign: 'middle', color: '#64748B' }}>{t.country}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid #334155', verticalAlign: 'middle', color: '#64748B', fontSize: 12 }}>{t.operating_hours || '—'}</td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: t.status === 'active' ? '#16A34A20' : '#EF444420', color: t.status === 'active' ? '#4ADE80' : '#F87171' }}>
                      {t.status || 'inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #334155', verticalAlign: 'middle' }}>
                    <button onClick={() => openEdit(t)} style={{ ...s.btn, background: '#7C3AED20', color: '#A78BFA' }}><Pencil size={12} />Edit</button>
                    <button onClick={() => handleDisable(t)} style={{ ...s.btn, background: t.status === 'active' ? '#EF444420' : '#16A34A20', color: t.status === 'active' ? '#F87171' : '#4ADE80' }}>
                      <Power size={12} />{t.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        )}
      </div>

      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            <div style={s.modalTitle}>{editing ? 'Edit Terminal' : 'Add Terminal'}</div>
            {(['name', 'city', 'state', 'country', 'address', 'operating_hours'] as const).map(field => (
              <div key={field}>
                <label style={s.label}>{field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                <input style={s.input} value={form[field]} onChange={e => f(field, e.target.value)} placeholder={field === 'operating_hours' ? 'e.g. 6am – 10pm daily' : ''} />
              </div>
            ))}
            <label style={s.label}>Status</label>
            <select style={s.select} value={form.status} onChange={e => f('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={14} />{editing ? 'Update Terminal' : 'Create Terminal'}</>}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
