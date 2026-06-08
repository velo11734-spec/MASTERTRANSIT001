'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ShieldCheck, User } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCustomers() {
      try {
        // Fetch passengers/users who have interacted with company assets
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, created_at')
          .eq('role', 'passenger')
          .limit(10)

        if (error) throw error
        setCustomers(data || [])
      } catch (err) {
        console.error('Failed to load customers:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Customer Database</h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>Search customer lists, review passenger histories, and manage local corporate memberships</p>
      </div>

      <div className="mt-card" style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
        {customers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <User size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#64748B' }}>No registered customers cataloged under your workspace yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Email</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Phone</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{c.full_name || 'Passenger'}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>{c.email}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>{c.phone || 'N/A'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge-verified">Active Account</span>
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
  )
}
