'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  BarChart3, RefreshCw, Users, Bus, Ticket,
  TrendingUp, DollarSign, MapPin, Star, Calendar,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalTrips: number;
  totalBookings: number;
  totalRevenue: number;
  totalRoutes: number;
  totalReviews: number;
  activeRoutes: number;
  pendingVerifications: number;
  openDisputes: number;
  monthlyBookings: { month: string; count: number }[];
}

const fmtNGN = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(n);

const s: Record<string, React.CSSProperties> = {
  page:    { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  title:   { fontSize: '26px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  card:    { background: '#1E293B', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#F1F5F9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  empty:   { textAlign: 'center' as const, padding: '40px 20px', color: '#475569' },
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { count: totalUsers },
        { count: totalCompanies },
        { count: totalTrips },
        { count: totalBookings },
        { count: totalRoutes },
        { count: totalReviews },
        { count: activeRoutes },
        { count: pendingVerifications },
        { count: openDisputes },
        { data: bookingsData },
        { data: paymentsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('routes').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('bookings').select('created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('payments').select('amount').eq('status', 'completed'),
      ]);

      // Aggregate monthly bookings
      const monthCounts: Record<number, number> = {};
      (bookingsData ?? []).forEach(b => {
        const m = new Date(b.created_at).getMonth();
        monthCounts[m] = (monthCounts[m] ?? 0) + 1;
      });
      const monthlyBookings = MONTH_LABELS.map((label, i) => ({ month: label, count: monthCounts[i] ?? 0 }));

      // Total revenue
      const totalRevenue = (paymentsData ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

      setStats({
        totalUsers: totalUsers ?? 0,
        totalCompanies: totalCompanies ?? 0,
        totalTrips: totalTrips ?? 0,
        totalBookings: totalBookings ?? 0,
        totalRevenue,
        totalRoutes: totalRoutes ?? 0,
        totalReviews: totalReviews ?? 0,
        activeRoutes: activeRoutes ?? 0,
        pendingVerifications: pendingVerifications ?? 0,
        openDisputes: openDisputes ?? 0,
        monthlyBookings,
      });
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxMonthly = Math.max(...(stats?.monthlyBookings.map(m => m.count) ?? [1]), 1);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}><BarChart3 size={24} color="#16A34A" /> Analytics Center</h1>
        <button id="refresh-analytics-btn" onClick={load} style={{ ...s.actionBtn, padding: '10px 14px' }}><RefreshCw size={16} /></button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
          <RefreshCw size={36} color="#334155" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '14px' }}>Crunching the numbers…</p>
        </div>
      ) : stats ? (
        <>
          {/* KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
              { label: 'Companies', value: stats.totalCompanies.toLocaleString(), icon: Bus, color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
              { label: 'Bookings', value: stats.totalBookings.toLocaleString(), icon: Ticket, color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
              { label: 'Platform Revenue', value: fmtNGN(stats.totalRevenue), icon: DollarSign, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
              { label: 'Active Routes', value: `${stats.activeRoutes} / ${stats.totalRoutes}`, icon: MapPin, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, fontWeight: 600 }}>{label}</p>
                  <Icon size={18} color={color} />
                </div>
                <p style={{ fontSize: '22px', fontWeight: 800, color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Secondary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total Trips', value: stats.totalTrips.toLocaleString(), color: '#06B6D4' },
              { label: 'Total Reviews', value: stats.totalReviews.toLocaleString(), color: '#F59E0B' },
              { label: 'Pending Applications', value: stats.pendingVerifications.toLocaleString(), color: '#EF4444' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>{label}</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Booking Chart */}
          <div style={s.card}>
            <p style={s.sectionTitle}><TrendingUp size={18} color="#16A34A" /> Bookings by Month (Last 500)</p>
            {stats.monthlyBookings.every(m => m.count === 0) ? (
              <div style={s.empty}>
                <Calendar size={36} color="#334155" />
                <p style={{ marginTop: '10px' }}>No booking data yet. Data will appear as bookings come in.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px', paddingBottom: '30px', position: 'relative' }}>
                {/* Y-axis label */}
                <div style={{ position: 'absolute', left: '-4px', top: 0, fontSize: '10px', color: '#475569' }}>Max: {maxMonthly}</div>
                {stats.monthlyBookings.map(({ month, count }) => {
                  const pct = count === 0 ? 0 : Math.max((count / maxMonthly) * 150, 4);
                  return (
                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>{count > 0 ? count : ''}</span>
                      <div style={{ width: '100%', background: count > 0 ? 'linear-gradient(180deg, #22C55E, #16A34A)' : '#1E3A2F', borderRadius: '5px 5px 0 0', height: `${pct}px`, transition: 'height 0.5s ease', boxShadow: count > 0 ? '0 0 12px rgba(22,163,74,0.4)' : 'none' }} />
                      <span style={{ fontSize: '11px', color: '#64748B' }}>{month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px' }}>
            <div style={{ ...s.card, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 6px' }}>Open Disputes</p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: '#EF4444', margin: 0 }}>{stats.openDisputes}</p>
              <a href="/en/admin/disputes" style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px', display: 'inline-block', fontWeight: 600 }}>Resolve disputes →</a>
            </div>
            <div style={{ ...s.card, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 6px' }}>Pending Partner Applications</p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: '#16A34A', margin: 0 }}>{stats.pendingVerifications}</p>
              <a href="/en/admin/verification" style={{ fontSize: '12px', color: '#16A34A', marginTop: '8px', display: 'inline-block', fontWeight: 600 }}>Review applications →</a>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>Failed to load analytics data.</div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
