'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Building2, ShieldCheck, Clock, Truck, Ticket,
  AlertTriangle, Flag, TrendingUp, Bell, CheckCircle2,
  ArrowRight, Activity, LayoutDashboard, CreditCard,
  HelpCircle, FileText, Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface KPI { label: string; value: string | number; icon: any; color: string; bg: string; href: string; sub?: string }
interface AdminNotification { id: string; title: string; body: string; type: string; is_read: boolean; created_at: string; link?: string }

export default function AdminOverviewPage() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [recentProfiles, setRecentProfiles] = useState<any[]>([])
  const [recentPartners, setRecentPartners] = useState<any[]>([])
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [
        { count: totalUsers },
        { count: totalCompanies },
        { count: verifiedCompanies },
        { count: pendingCompanies },
        { count: partnerApps },
        { count: openDisputes },
        { count: fraudFlags },
        { data: profiles },
        { data: partners },
        { data: notifs },
        { count: helpArticles },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('partner_applications').select('*', { count: 'exact', head: true }),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('fraud_flags').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('partner_applications').select('id, org_name, partnership_category, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('help_articles').select('*', { count: 'exact', head: true }),
      ])

      setKpis([
        { label: 'Total Users', value: totalUsers || 0, icon: Users, color: '#2563EB', bg: '#EFF6FF', href: '/en/admin/users' },
        { label: 'Total Companies', value: totalCompanies || 0, icon: Building2, color: '#7C3AED', bg: '#F5F3FF', href: '/en/admin/companies' },
        { label: 'Verified Companies', value: verifiedCompanies || 0, icon: ShieldCheck, color: '#16A34A', bg: '#F0FDF4', href: '/en/admin/companies', sub: 'Approved' },
        { label: 'Pending Review', value: pendingCompanies || 0, icon: Clock, color: '#D97706', bg: '#FFFBEB', href: '/en/admin/verification', sub: 'Awaiting' },
        { label: 'Partner Applications', value: (partnerApps as any)?.count ?? 0, icon: Ticket, color: '#0891B2', bg: '#ECFEFF', href: '/en/admin/companies' },
        { label: 'Open Disputes', value: (openDisputes as any)?.count ?? 0, icon: AlertTriangle, color: '#EA580C', bg: '#FFF7ED', href: '/en/admin/disputes' },
        { label: 'Fraud Flags', value: (fraudFlags as any)?.count ?? 0, icon: Flag, color: '#DC2626', bg: '#FEF2F2', href: '/en/admin/fraud' },
        { label: 'Help Articles', value: (helpArticles as any)?.count ?? 0, icon: HelpCircle, color: '#475569', bg: '#F8FAFC', href: '/en/admin/help-content' },
      ])

      setRecentProfiles(profiles || [])
      setRecentPartners((partners as any)?.data || partners || [])
      setNotifications((notifs as any)?.data || notifs || [])
    } catch (err) {
      console.error('Overview fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id: string) => {
    try {
      await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id)
    } catch (err) {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const notifColor = (type: string) => {
    if (type === 'success') return '#16A34A'
    if (type === 'warning') return '#D97706'
    if (type === 'error') return '#DC2626'
    return '#2563EB'
  }

  const quickActions = [
    { label: 'Review Pending Companies', href: '/en/admin/verification', icon: ShieldCheck, color: '#16A34A' },
    { label: 'Manage Users', href: '/en/admin/users', icon: Users, color: '#2563EB' },
    { label: 'View Disputes', href: '/en/admin/disputes', icon: AlertTriangle, color: '#EA580C' },
    { label: 'Payment Management', href: '/en/admin/payments', icon: CreditCard, color: '#7C3AED' },
    { label: 'Platform Settings', href: '/en/admin/settings', icon: LayoutDashboard, color: '#475569' },
    { label: 'Audit Logs', href: '/en/admin/audit-logs', icon: FileText, color: '#0891B2' },
  ]

  return (
    <div style={{ fontFamily: "'Outfit','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');`}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Admin Control Center</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Executive Overview</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Real-time platform intelligence at a glance</p>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading dashboard data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 36 }}>
          {kpis.map(kpi => (
            <Link key={kpi.label} href={kpi.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '20px 22px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <kpi.icon size={20} style={{ color: kpi.color }} />
                  </div>
                  <ArrowRight size={14} style={{ color: '#CBD5E1', marginTop: 4 }} />
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1, marginBottom: 4 }}>{kpi.value}</p>
                <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{kpi.label}</p>
                {kpi.sub && <p style={{ fontSize: 11, color: kpi.color, fontWeight: 600, marginTop: 4 }}>{kpi.sub}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Three-column grid: Recent Registrations | Partner Apps | Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 32 }}>

        {/* Recent Registrations */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: '#2563EB' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent Users</span>
            </div>
            <Link href="/en/admin/users" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          {recentProfiles.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No users yet</div>
          ) : (
            recentProfiles.map(u => (
              <div key={u.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name || 'Unknown'}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>{u.role} • {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Partner Applications */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ticket size={16} style={{ color: '#0891B2' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Partner Applications</span>
            </div>
            <Link href="/en/admin/companies" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          {recentPartners.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No applications yet</div>
          ) : (
            recentPartners.map((p: any) => (
              <div key={p.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F8FAFC' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{p.org_name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>{p.partnership_category}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                    background: p.status === 'approved' ? '#DCFCE7' : p.status === 'rejected' ? '#FEE2E2' : '#FEF9C3',
                    color: p.status === 'approved' ? '#15803D' : p.status === 'rejected' ? '#DC2626' : '#854D0E',
                  }}>{p.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Admin Notifications */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} style={{ color: '#EA580C' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Admin Notifications</span>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#DC2626', color: '#fff', borderRadius: 999, padding: '1px 6px', marginLeft: 'auto' }}>
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No notifications</div>
          ) : (
            notifications.slice(0, 7).map(n => (
              <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid #F8FAFC', background: n.is_read ? '#FFFFFF' : '#FAFDF7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: notifColor(n.type), flexShrink: 0 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{n.title}</p>
                  </div>
                  <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{n.body}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', flexShrink: 0 }}>
                    <CheckCircle2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} style={{ color: '#16A34A' }} />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Quick Actions</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {quickActions.map(qa => (
            <Link key={qa.label} href={qa.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                border: '1px solid #E2E8F0', borderRadius: 10, transition: 'all 0.15s', cursor: 'pointer',
                background: '#FAFAFA',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.borderColor = '#BBF7D0' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#E2E8F0' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${qa.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <qa.icon size={16} style={{ color: qa.color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{qa.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
