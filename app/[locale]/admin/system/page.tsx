'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Activity, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Database, Server, Cpu, Globe,
  Clock, Users, Shield,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TableStat {
  table: string;
  count: number | null;
  error: boolean;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface HealthCheck {
  name: string;
  status: 'ok' | 'error' | 'warn' | 'checking';
  message: string;
  icon: React.ElementType;
}

const s: Record<string, React.CSSProperties> = {
  page:    { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  title:   { fontSize: '26px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  card:    { background: '#1E293B', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', marginBottom: '20px' },
  sectionTitle: { fontSize: '14px', fontWeight: 700, color: '#94A3B8', marginBottom: '16px', textTransform: 'uppercase' as const, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '7px' },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
};

const TABLE_DEFS: { table: string; label: string; icon: React.ElementType; color: string }[] = [
  { table: 'profiles',            label: 'Users',               icon: Users,    color: '#2563EB' },
  { table: 'companies',           label: 'Companies',            icon: Globe,    color: '#D97706' },
  { table: 'trips',               label: 'Trips',                icon: Activity, color: '#16A34A' },
  { table: 'bookings',            label: 'Bookings',             icon: Database, color: '#8B5CF6' },
  { table: 'payments',            label: 'Payments',             icon: Server,   color: '#EC4899' },
  { table: 'routes',              label: 'Routes',               icon: Globe,    color: '#06B6D4' },
  { table: 'disputes',            label: 'Disputes',             icon: AlertTriangle, color: '#EF4444' },
  { table: 'reviews',             label: 'Reviews',              icon: Activity, color: '#F59E0B' },
  { table: 'audit_logs',          label: 'Audit Logs',           icon: Shield,   color: '#A78BFA' },
  { table: 'fraud_flags',         label: 'Fraud Flags',          icon: AlertTriangle, color: '#DC2626' },
  { table: 'terminals',           label: 'Terminals',            icon: Server,   color: '#14B8A6' },
  { table: 'platform_settings',   label: 'Platform Settings',    icon: Cpu,      color: '#64748B' },
  { table: 'partner_applications',label: 'Partner Applications', icon: Users,    color: '#F472B6' },
  { table: 'help_categories',     label: 'Help Categories',      icon: Database, color: '#34D399' },
  { table: 'help_articles',       label: 'Help Articles',        icon: Database, color: '#60A5FA' },
  { table: 'notifications_log',   label: 'Notifications Log',    icon: Server,   color: '#FBBF24' },
];

function StatusIcon({ status }: { status: HealthCheck['status'] }) {
  if (status === 'ok')       return <CheckCircle size={18} color="#22C55E" />;
  if (status === 'error')    return <XCircle size={18} color="#EF4444" />;
  if (status === 'warn')     return <AlertTriangle size={18} color="#F59E0B" />;
  return <RefreshCw size={18} color="#64748B" style={{ animation: 'spin 1s linear infinite' }} />;
}

export default function SystemHealthPage() {
  const [tableCounts, setTableCounts] = useState<TableStat[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    { name: 'Supabase Auth',     status: 'checking', message: 'Checking…', icon: Shield },
    { name: 'Database (Profiles)', status: 'checking', message: 'Checking…', icon: Database },
    { name: 'Platform Settings',  status: 'checking', message: 'Checking…', icon: Cpu },
    { name: 'Audit Log Service',  status: 'checking', message: 'Checking…', icon: Clock },
  ]);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    setLoading(true);
    const checks: HealthCheck[] = [
      { name: 'Supabase Auth',     status: 'checking', message: 'Checking…', icon: Shield },
      { name: 'Database (Profiles)', status: 'checking', message: 'Checking…', icon: Database },
      { name: 'Platform Settings',  status: 'checking', message: 'Checking…', icon: Cpu },
      { name: 'Audit Log Service',  status: 'checking', message: 'Checking…', icon: Clock },
    ];
    setHealthChecks([...checks]);

    // 1. Auth check
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      checks[0] = { ...checks[0], status: user ? 'ok' : 'warn', message: user ? `Authenticated as ${user.email}` : 'No authenticated session' };
    } catch (_) {
      checks[0] = { ...checks[0], status: 'error', message: 'Auth service unavailable' };
    }
    setHealthChecks([...checks]);

    // 2. DB check
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      checks[1] = { ...checks[1], status: error ? 'error' : 'ok', message: error ? `Error: ${error.message}` : 'Profiles table reachable' };
    } catch (_) {
      checks[1] = { ...checks[1], status: 'error', message: 'Database unreachable' };
    }
    setHealthChecks([...checks]);

    // 3. Platform settings
    try {
      const { data, error } = await supabase.from('platform_settings').select('key').limit(1);
      checks[2] = { ...checks[2], status: error ? 'warn' : (data && data.length > 0 ? 'ok' : 'warn'), message: error ? 'Settings table error' : data?.length ? 'Settings loaded OK' : 'No settings configured' };
    } catch (_) {
      checks[2] = { ...checks[2], status: 'warn', message: 'Could not reach settings table' };
    }
    setHealthChecks([...checks]);

    // 4. Audit log
    try {
      const { error } = await supabase.from('audit_logs').select('id').limit(1);
      checks[3] = { ...checks[3], status: error ? 'error' : 'ok', message: error ? `Audit log error: ${error.message}` : 'Audit log service operational' };
    } catch (_) {
      checks[3] = { ...checks[3], status: 'error', message: 'Audit log service unreachable' };
    }
    setHealthChecks([...checks]);

    // Table row counts
    const results: TableStat[] = await Promise.all(
      TABLE_DEFS.map(async ({ table, label, icon, color }) => {
        try {
          const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          return { table, count, error: !!error, label, icon, color };
        } catch (_) {
          return { table, count: null, error: true, label, icon, color };
        }
      })
    );
    setTableCounts(results);
    setCheckedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const overallStatus = healthChecks.every(h => h.status === 'ok') ? 'healthy' : healthChecks.some(h => h.status === 'error') ? 'critical' : 'degraded';

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}><Activity size={24} color="#16A34A" /> System Health</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {checkedAt && <span style={{ fontSize: '12px', color: '#475569' }}>Last checked: {checkedAt.toLocaleTimeString()}</span>}
          <button id="refresh-health-btn" onClick={runChecks} disabled={loading} style={{ ...s.actionBtn, padding: '10px 14px', opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Run Checks
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div style={{
        background: overallStatus === 'healthy' ? 'rgba(22,163,74,0.1)' : overallStatus === 'critical' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
        border: `1px solid ${overallStatus === 'healthy' ? 'rgba(22,163,74,0.3)' : overallStatus === 'critical' ? 'rgba(220,38,38,0.3)' : 'rgba(217,119,6,0.3)'}`,
        borderRadius: '14px', padding: '18px 24px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        {overallStatus === 'healthy'
          ? <CheckCircle size={28} color="#22C55E" />
          : overallStatus === 'critical'
          ? <XCircle size={28} color="#EF4444" />
          : <AlertTriangle size={28} color="#F59E0B" />
        }
        <div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
            Platform is {overallStatus === 'healthy' ? '🟢 Healthy' : overallStatus === 'critical' ? '🔴 Critical' : '🟡 Degraded'}
          </p>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            {overallStatus === 'healthy' ? 'All services are operational.' : overallStatus === 'critical' ? 'One or more critical services are down.' : 'Some services may be experiencing issues.'}
          </p>
        </div>
      </div>

      {/* Health Checks */}
      <div style={s.card}>
        <p style={s.sectionTitle}><Shield size={16} /> Service Status</p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
          {healthChecks.map(check => {
            const Icon = check.icon;
            const bg = check.status === 'ok' ? 'rgba(22,163,74,0.05)' : check.status === 'error' ? 'rgba(220,38,38,0.05)' : check.status === 'warn' ? 'rgba(217,119,6,0.05)' : 'rgba(255,255,255,0.02)';
            const border = check.status === 'ok' ? 'rgba(22,163,74,0.2)' : check.status === 'error' ? 'rgba(220,38,38,0.2)' : check.status === 'warn' ? 'rgba(217,119,6,0.2)' : 'rgba(255,255,255,0.06)';
            return (
              <div key={check.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color="#64748B" />
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>{check.name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>{check.message}</p>
                  </div>
                </div>
                <StatusIcon status={check.status} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Database Table Counts */}
      <div style={s.card}>
        <p style={s.sectionTitle}><Database size={16} /> Database Table Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {tableCounts.map(({ label, count, error, icon: Icon, color }) => (
            <div key={label} style={{ background: error ? 'rgba(220,38,38,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${error ? 'rgba(220,38,38,0.2)' : '#334155'}`, borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Icon size={16} color={error ? '#EF4444' : color} />
                {error && <AlertTriangle size={13} color="#EF4444" />}
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: error ? '#EF4444' : color, margin: '0 0 4px' }}>
                {error ? '—' : (count ?? 0).toLocaleString()}
              </p>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0, fontWeight: 600 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
