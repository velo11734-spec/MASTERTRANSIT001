'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Users, Search, ChevronDown, X, Shield, AlertTriangle,
  RefreshCw, Trash2, Eye, Check, Loader2, ChevronRight
} from 'lucide-react';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string | null;
};

type Toast = { message: string; type: 'success' | 'error' };

const ROLES = ['passenger', 'company', 'driver', 'admin', 'suspended'];
const FILTER_TABS = ['All', 'passenger', 'company', 'driver', 'admin'];

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94A3B8', marginBottom: 24 },
  breadcrumbLink: { color: '#16A34A', cursor: 'pointer' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 10 },
  card: { background: '#1E293B', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  searchRow: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' },
  searchInput: { flex: 1, background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: '10px 16px', color: '#F8FAFC', fontSize: 14, outline: 'none' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' },
  tabActive: { background: '#16A34A', color: '#fff' },
  tabInactive: { background: '#0F172A', color: '#94A3B8' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: 1, borderBottom: '1px solid #334155' },
  actionBtn: { padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 6 },
  modalOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1E293B', borderRadius: 18, padding: 32, width: 520, maxHeight: '85vh', overflowY: 'auto' as const, position: 'relative' as const, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' },
  modalTitle: { fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#F8FAFC' },
  closeBtn: { position: 'absolute' as const, top: 16, right: 16, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, display: 'block', fontWeight: 600 },
  select: { width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', color: '#F8FAFC', fontSize: 14, outline: 'none', marginBottom: 16 },
  saveBtn: { background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', color: '#475569' },
};

async function logAudit(action: string, entityType: string, entityId: string, newValue: object) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_email: user.email,
    action,
    entity_type: entityType,
    entity_id: entityId,
    new_value: newValue,
  });
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [toast, setToast] = useState<Toast | null>(null);
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .order('created_at', { ascending: false });
    if (error) { showToast('Failed to load users', 'error'); }
    else { setProfiles(data || []); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const filtered = profiles.filter(p => {
    const matchTab = activeTab === 'All' || p.role === activeTab;
    const matchSearch = !search || (p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const handleUpdateRole = async () => {
    if (!editUser || !editRole) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ role: editRole }).eq('id', editUser.id);
    if (error) { showToast('Failed to update role', 'error'); }
    else {
      await logAudit('UPDATE_ROLE', 'user', editUser.id, { role: editRole });
      showToast('Role updated successfully', 'success');
      setEditUser(null);
      fetchProfiles();
    }
    setSaving(false);
  };

  const handleDelete = async (user: Profile) => {
    if (!confirm(`Delete user ${user.full_name || user.email}? This cannot be undone.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) { showToast('Failed to delete user', 'error'); }
    else {
      await logAudit('DELETE_USER', 'user', user.id, { email: user.email });
      showToast('User deleted', 'success');
      fetchProfiles();
    }
  };

  return (
    <div style={styles.page}>
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

      <div style={styles.breadcrumb}>
        <span style={styles.breadcrumbLink}>Admin</span>
        <ChevronRight size={14} />
        <span>User Management</span>
      </div>

      <div style={styles.header}>
        <div style={styles.title}><Users size={26} color="#16A34A" /> User Management</div>
        <button onClick={fetchProfiles} style={{ ...styles.actionBtn, background: '#0F172A', color: '#94A3B8', border: '1px solid #334155', padding: '9px 16px' }}>
          <RefreshCw size={14} style={{ marginRight: 6, display: 'inline' }} />Refresh
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.searchRow}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              style={{ ...styles.searchInput, paddingLeft: 36 }}
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ color: '#64748B', fontSize: 13 }}>{filtered.length} users</span>
        </div>

        <div style={styles.tabs}>
          {FILTER_TABS.map(tab => (
            <button key={tab} style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : styles.tabInactive) }} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.emptyState}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#16A34A', margin: '0 auto 12px', display: 'block' }} />Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}><Users size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#334155' }} />No users found</div>
        ) : (
          <div className="mt-table-wrap">
<table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} style={{ background: 'transparent' }}>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #1E293B', verticalAlign: 'middle' }}><span style={{ fontWeight: 600, color: '#E2E8F0' }}>{user.full_name || '—'}</span></td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #1E293B', verticalAlign: 'middle', color: '#94A3B8' }}>{user.email || '—'}</td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #1E293B', verticalAlign: 'middle', color: '#94A3B8' }}>{user.phone || '—'}</td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #1E293B', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: user.role === 'admin' ? '#7C3AED20' : user.role === 'driver' ? '#0EA5E920' : user.role === 'company' ? '#F59E0B20' : user.role === 'suspended' ? '#EF444420' : '#16A34A20',
                      color: user.role === 'admin' ? '#A78BFA' : user.role === 'driver' ? '#38BDF8' : user.role === 'company' ? '#FBBF24' : user.role === 'suspended' ? '#F87171' : '#4ADE80',
                    }}>
                      {user.role || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid #1E293B', verticalAlign: 'middle', color: '#64748B', fontSize: 12 }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '13px 14px', fontSize: 14, borderBottom: '1px solid #1E293B', verticalAlign: 'middle' }}>
                    <button onClick={() => setViewUser(user)} style={{ ...styles.actionBtn, background: '#0EA5E920', color: '#38BDF8' }} title="View"><Eye size={13} /></button>
                    <button onClick={() => { setEditUser(user); setEditRole(user.role || 'passenger'); }} style={{ ...styles.actionBtn, background: '#7C3AED20', color: '#A78BFA' }} title="Edit Role"><Shield size={13} /></button>
                    {user.role !== 'suspended'
                      ? <button onClick={() => handleSuspend(user)} style={{ ...styles.actionBtn, background: '#F59E0B20', color: '#FBBF24' }} title="Suspend"><AlertTriangle size={13} /></button>
                      : <button onClick={() => handleReactivate(user)} style={{ ...styles.actionBtn, background: '#16A34A20', color: '#4ADE80' }} title="Reactivate"><Check size={13} /></button>
                    }
                    <button onClick={() => handleDelete(user)} style={{ ...styles.actionBtn, background: '#EF444420', color: '#F87171' }} title="Delete"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        )}
      </div>

      {/* View Modal */}
      {viewUser && (
        <div style={styles.modalOverlay} onClick={() => setViewUser(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setViewUser(null)}><X size={20} /></button>
            <div style={styles.modalTitle}>User Details</div>
            {[
              ['ID', viewUser.id],
              ['Full Name', viewUser.full_name],
              ['Email', viewUser.email],
              ['Phone', viewUser.phone],
              ['Role', viewUser.role],
              ['Joined', viewUser.created_at ? new Date(viewUser.created_at).toLocaleString() : '—'],
            ].map(([label, val]) => (
              <div key={label as string} style={{ marginBottom: 14 }}>
                <span style={styles.label}>{label}</span>
                <div style={{ color: '#E2E8F0', fontSize: 14, background: '#0F172A', padding: '9px 14px', borderRadius: 8 }}>{val || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editUser && (
        <div style={styles.modalOverlay} onClick={() => setEditUser(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setEditUser(null)}><X size={20} /></button>
            <div style={styles.modalTitle}>Edit Role — {editUser.full_name || editUser.email}</div>
            <label style={styles.label}>New Role</label>
            <select style={styles.select} value={editRole} onChange={e => setEditRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <button style={styles.saveBtn} onClick={handleUpdateRole} disabled={saving}>
              {saving ? <Loader2 size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /> : <><Check size={14} style={{ display: 'inline', marginRight: 6 }} />Save Role</>}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  async function handleSuspend(user: Profile) {
    const { error } = await supabase.from('profiles').update({ role: 'suspended' }).eq('id', user.id);
    if (error) showToast('Failed to suspend user', 'error');
    else { await logAudit('SUSPEND_USER', 'user', user.id, { role: 'suspended' }); showToast('User suspended', 'success'); fetchProfiles(); }
  }

  async function handleReactivate(user: Profile) {
    const { error } = await supabase.from('profiles').update({ role: 'passenger' }).eq('id', user.id);
    if (error) showToast('Failed to reactivate user', 'error');
    else { await logAudit('REACTIVATE_USER', 'user', user.id, { role: 'passenger' }); showToast('User reactivated', 'success'); fetchProfiles(); }
  }
}
