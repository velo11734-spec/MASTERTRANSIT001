'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Bell, Send, CheckCircle, AlertCircle, Clock, Users, Mail, MessageSquare, Smartphone } from 'lucide-react'

interface Notification {
  id: string
  title: string
  body: string
  channel: string
  target_type: string
  target_role: string | null
  status: string
  scheduled_at: string | null
  created_at: string
}

interface Stats { total: number; pending: number; failed: number }

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  push: <Smartphone size={13} />,
  email: <Mail size={13} />,
  sms: <MessageSquare size={13} />,
  in_app: <Bell size={13} />,
}

const CHANNEL_COLORS: Record<string, string> = {
  push: '#8B5CF6', email: '#3B82F6', sms: '#F59E0B', in_app: '#16A34A',
}

const STATUS_COLORS: Record<string, string> = {
  sent: '#16A34A', pending: '#F59E0B', failed: '#EF4444', scheduled: '#3B82F6',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', body: '', channel: 'push', target_type: 'all', target_role: '', scheduled_at: '',
  })

  useEffect(() => {
    fetchAdmin()
    fetchNotifications()
  }, [])

  async function fetchAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    setAdminId(user?.id ?? null)
    setAdminEmail(user?.email ?? null)
  }

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) {
      setNotifications(data)
      setStats({
        total: data.length,
        pending: data.filter((n: Notification) => n.status === 'pending').length,
        failed: data.filter((n: Notification) => n.status === 'failed').length,
      })
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const payload: Record<string, unknown> = {
      title: form.title, body: form.body,
      channel: form.channel, target_type: form.target_type,
      target_role: form.target_type === 'role' ? form.target_role : null,
      scheduled_at: form.scheduled_at || null,
      status: form.scheduled_at ? 'scheduled' : 'pending',
      created_by: adminId,
    }
    const { error } = await supabase.from('notifications_log').insert(payload)
    if (!error) {
      await supabase.from('audit_logs').insert({
        actor_id: adminId, actor_email: adminEmail,
        action: 'create_notification', entity_type: 'notifications_log',
        metadata: { title: form.title, channel: form.channel, target_type: form.target_type },
      })
      setSuccess(true)
      setForm({ title: '', body: '', channel: 'push', target_type: 'all', target_role: '', scheduled_at: '' })
      fetchNotifications()
      setTimeout(() => setSuccess(false), 3000)
    }
    setSubmitting(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #E2E8F0', fontFamily: 'Outfit, sans-serif',
    fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const,
    background: '#fff',
  }

  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 } as const

  return (
    <div style={{ fontFamily: 'Outfit, sans-serif', padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0 }}>Notification Center</h1>
        <p style={{ color: '#64748B', marginTop: 4, margin: 0 }}>Send and manage platform notifications.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Sent', value: stats.total, color: '#16A34A', icon: <CheckCircle size={20} color="#16A34A" /> },
          { label: 'Pending', value: stats.pending, color: '#F59E0B', icon: <Clock size={20} color="#F59E0B" /> },
          { label: 'Failed', value: stats.failed, color: '#EF4444', icon: <AlertCircle size={20} color="#EF4444" /> },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0F172A' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        {/* Create Form */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} color="#16A34A" />
            <span style={{ fontWeight: 600, fontSize: 16, color: '#0F172A' }}>Create Notification</span>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Notification title" />
            </div>
            <div>
              <label style={labelStyle}>Body</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required placeholder="Notification message..." />
            </div>
            <div>
              <label style={labelStyle}>Channel</label>
              <select style={inputStyle} value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                <option value="push">Push Notification</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Type</label>
              <select style={inputStyle} value={form.target_type} onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))}>
                <option value="all">All Users</option>
                <option value="role">By Role</option>
                <option value="specific">Specific User</option>
              </select>
            </div>
            {form.target_type === 'role' && (
              <div>
                <label style={labelStyle}>Target Role</label>
                <select style={inputStyle} value={form.target_role} onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))}>
                  <option value="">Select role...</option>
                  <option value="user">User</option>
                  <option value="driver">Driver</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>Schedule At (optional)</label>
              <input type="datetime-local" style={inputStyle} value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            {success && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', color: '#16A34A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Notification created successfully!
              </div>
            )}
            <button type="submit" disabled={submitting} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 10, border: 'none', background: '#16A34A',
              color: '#fff', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
            }}>
              <Send size={15} /> {submitting ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* Past Notifications Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} color="#3B82F6" />
            <span style={{ fontWeight: 600, fontSize: 16, color: '#0F172A' }}>Notification History</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Title', 'Channel', 'Target', 'Status', 'Sent At'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {notifications.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>No notifications yet.</td></tr>
                  ) : notifications.map(n => (
                    <tr key={n.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{n.title}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: (CHANNEL_COLORS[n.channel] || '#64748B') + '18', color: CHANNEL_COLORS[n.channel] || '#64748B', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                          {CHANNEL_ICONS[n.channel]} {n.channel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>
                        {n.target_type === 'role' ? `Role: ${n.target_role}` : n.target_type}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: (STATUS_COLORS[n.status] || '#94A3B8') + '18', color: STATUS_COLORS[n.status] || '#94A3B8', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {n.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8' }}>
                        {n.scheduled_at ? new Date(n.scheduled_at).toLocaleString() : new Date(n.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
