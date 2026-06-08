'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Lock, RefreshCw, Shield, ShieldOff, Users,
  Activity, Clock, AlertTriangle, Eye, X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

interface AuthSession {
  user_id: string;
  email: string | null;
  last_sign_in_at: string | null;
  created_at: string;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const s: Record<string, React.CSSProperties> = {
  page:    { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  title:   { fontSize: '26px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  card:    { background: '#1E293B', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', marginBottom: '20px' },
  table:   { width: '100%', borderCollapse: 'collapse' as const },
  th:      { textAlign: 'left' as const, padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '1px', borderBottom: '1px solid #334155' },
  td:      { padding: '12px 14px', fontSize: '13px', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  badge:   { borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  empty:   { textAlign: 'center' as const, padding: '40px 20px', color: '#475569' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#F1F5F9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
};

export default function SecurityPage() {
  const [recentLogs, setRecentLogs]     = useState<AuditEntry[]>([]);
  const [loading, setLoading]           = useState(true);
  const [maintenanceMode, setMaintenance] = useState(false);
  const [bookingFreeze, setBookingFreeze] = useState(false);
  const [userCount, setUserCount]       = useState<number | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Recent audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('id, actor_email, action, entity_type, entity_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      setRecentLogs(logs ?? []);

      // Platform settings
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'booking_freeze']);
      if (settings) {
        const mm = settings.find(s => s.key === 'maintenance_mode');
        const bf = settings.find(s => s.key === 'booking_freeze');
        setMaintenance(mm?.value === 'true');
        setBookingFreeze(bf?.value === 'true');
      }

      // User count from profiles
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      setUserCount(count);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSetting = async (key: string, current: boolean) => {
    const newVal = !current;
    try {
      await supabase.from('platform_settings').upsert({ key, value: newVal ? 'true' : 'false', updated_at: new Date().toISOString() }, { onConflict: 'key' });
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        actor_id: user?.id, actor_email: user?.email,
        action: `SECURITY_TOGGLE_${key.toUpperCase()}_${newVal ? 'ON' : 'OFF'}`,
        entity_type: 'platform_setting', entity_id: key,
      });
      if (key === 'maintenance_mode') setMaintenance(newVal);
      if (key === 'booking_freeze') setBookingFreeze(newVal);
      showToast(`${key.replace(/_/g, ' ')} ${newVal ? 'enabled' : 'disabled'}`);
    } catch (_) { showToast('Failed to toggle setting', false); }
  };

  // Categorize actions
  const adminActions   = recentLogs.filter(l => l.action?.startsWith('ADMIN') || l.action?.startsWith('ROUTE') || l.action?.startsWith('USER') || l.action?.startsWith('EMERGENCY'));
  const securityEvents = recentLogs.filter(l => l.action?.startsWith('SECURITY') || l.action?.includes('SUSPEND') || l.action?.includes('BAN') || l.action?.includes('FREEZE'));

  return (
    <div style={s.page}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}><Lock size={24} color="#8B5CF6" /> Security Center</h1>
        <button id="refresh-security-btn" onClick={load} style={{ ...s.actionBtn, padding: '10px 14px' }}><RefreshCw size={16} /></button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Users', value: userCount != null ? userCount.toString() : '…', icon: Users, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
          { label: 'Recent Actions', value: recentLogs.length.toString(), icon: Activity, color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
          { label: 'Security Events', value: securityEvents.length.toString(), icon: AlertTriangle, color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
          { label: 'Maintenance Mode', value: maintenanceMode ? 'ACTIVE' : 'OFF', icon: Shield, color: maintenanceMode ? '#DC2626' : '#16A34A', bg: maintenanceMode ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Icon size={18} color={color} />
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{label}</p>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 800, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Security Controls */}
      <div style={s.card}>
        <p style={s.sectionTitle}><Shield size={18} color="#8B5CF6" /> Platform Security Controls</p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
          {[
            {
              key: 'maintenance_mode',
              label: 'Maintenance Mode',
              desc: 'Takes the entire platform offline for all users.',
              value: maintenanceMode,
              danger: true,
            },
            {
              key: 'booking_freeze',
              label: 'Booking Freeze',
              desc: 'Prevents all new bookings from being placed.',
              value: bookingFreeze,
              danger: false,
            },
          ].map(ctrl => (
            <div key={ctrl.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: ctrl.value ? (ctrl.danger ? 'rgba(220,38,38,0.08)' : 'rgba(217,119,6,0.08)') : 'rgba(255,255,255,0.03)', border: `1px solid ${ctrl.value ? (ctrl.danger ? 'rgba(220,38,38,0.3)' : 'rgba(217,119,6,0.3)') : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '16px 20px' }}>
              <div>
                <p style={{ color: ctrl.value ? (ctrl.danger ? '#FCA5A5' : '#FDE68A') : '#E2E8F0', fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>{ctrl.label}</p>
                <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>{ctrl.desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: ctrl.value ? '#EF4444' : '#22C55E', fontWeight: 700 }}>{ctrl.value ? 'ACTIVE' : 'OFF'}</span>
                <button
                  id={`security-toggle-${ctrl.key}`}
                  onClick={() => toggleSetting(ctrl.key, ctrl.value)}
                  style={{ position: 'relative', width: '48px', height: '26px', borderRadius: '13px', background: ctrl.value ? '#DC2626' : '#374151', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <span style={{ position: 'absolute', top: '4px', left: ctrl.value ? '26px' : '4px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Audit Log */}
      <div style={s.card}>
        <p style={s.sectionTitle}><Clock size={18} color="#16A34A" /> Recent Admin Activity</p>
        {loading ? (
          <div style={s.empty}><RefreshCw size={28} color="#334155" style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : recentLogs.length === 0 ? (
          <div style={s.empty}>
            <ShieldOff size={36} color="#334155" />
            <p style={{ marginTop: '10px' }}>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="mt-table-wrap">
<table style={s.table}>
            <thead>
              <tr>
                {['Actor', 'Action', 'Entity', 'Timestamp'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recentLogs.map(log => (
                <tr key={log.id} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={s.td}>{log.actor_email ?? <span style={{ color: '#475569' }}>System</span>}</td>
                  <td style={s.td}><code style={{ fontSize: '11.5px', color: '#A78BFA', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{log.action}</code></td>
                  <td style={s.td}>{log.entity_type ? <span style={{ textTransform: 'capitalize' as const }}>{log.entity_type}</span> : '—'}</td>
                  <td style={s.td}>{fmtDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
