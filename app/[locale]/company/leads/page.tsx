'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Users, AlertCircle, Trash2, ArrowRight } from 'lucide-react'

export default function LeadsPage() {
  const [company, setCompany] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeads() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (comp) {
          setCompany(comp)
          const { data: leadData } = await supabase
            .from('vehicle_leads')
            .select('*')
            .eq('company_id', comp.id)
            .order('created_at', { ascending: false })
          setLeads(leadData || [])
        }
      } catch (err) {
        console.error('Failed to load leads:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLeads()
  }, [])

  const handleUpdateStage = async (id: string, stage: string) => {
    try {
      const { error } = await supabase
        .from('vehicle_leads')
        .update({ stage })
        .eq('id', id)

      if (error) throw error

      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
    } catch (err) {
      console.error('Failed to update lead stage:', err)
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to discard this lead?')) return
    try {
      const { error } = await supabase
        .from('vehicle_leads')
        .delete()
        .eq('id', id)

      if (error) throw error
      setLeads(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      console.error('Failed to discard lead:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 250, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Sales Leads Pipeline</h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>Track expressions of interest, negotiate prices, and process inspections for vehicle listings</p>
      </div>

      <div className="mt-card" style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
        {leads.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Users size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#64748B' }}>No leads recorded yet. Prospective buyers will appear here when they request inspections.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Customer Name</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Contact Info</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Interest Type</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Pipeline Stage</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>{lead.customer_name}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B' }}>
                      {lead.customer_email || 'N/A'} <br />
                      {lead.customer_phone || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 600, textTransform: 'capitalize' }}>
                      {lead.interest_type ? lead.interest_type.replace('_', ' ') : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        className="mt-input"
                        style={{ padding: '4px 8px', fontSize: 12, width: 'auto', display: 'inline-block', height: 'auto' }}
                        value={lead.stage}
                        onChange={e => handleUpdateStage(lead.id, e.target.value)}
                      >
                        <option value="new">New Inquiry</option>
                        <option value="contacted">Contacted</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="sold">Sold (Closed)</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
