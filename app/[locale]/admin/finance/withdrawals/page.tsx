'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Search, CreditCard, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('passenger_withdrawal_requests')
      .select(`
        *,
        profiles:user_id ( full_name, phone )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRequests(data)
    }
    setLoading(false)
  }

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to mark this as ${action}?`)) return
    
    setActionLoading(id)
    try {
      // Find request
      const req = requests.find(r => r.id === id)
      if (!req) throw new Error('Request not found')

      // Update status
      const { error: updateError } = await supabase
        .from('passenger_withdrawal_requests')
        .update({ 
          status: action,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Update wallet transaction status
      await supabase
        .from('passenger_wallet_transactions')
        .update({ status: action === 'approved' ? 'completed' : 'failed' })
        .eq('linked_entity_id', id)
        .eq('linked_entity_type', 'withdrawal_request')

      if (action === 'rejected') {
        // Refund the user's wallet
        const { data: wallet } = await supabase
          .from('passenger_wallets')
          .select('id, spendable_balance')
          .eq('id', req.wallet_id)
          .single()

        if (wallet) {
          const newBalance = wallet.spendable_balance + req.amount
          await supabase
            .from('passenger_wallets')
            .update({ spendable_balance: newBalance })
            .eq('id', wallet.id)

          // Create refund transaction
          await supabase.from('passenger_wallet_transactions').insert({
            wallet_id: wallet.id,
            transaction_intent: 'REFUND_CREDIT',
            payment_method: 'wallet',
            status: 'completed',
            amount: req.amount,
            balance_after: newBalance,
            description: 'Refund for rejected withdrawal request',
            linked_entity_id: id,
            linked_entity_type: 'withdrawal_request'
          })
        }
      }

      alert(`Request ${action} successfully`)
      fetchRequests()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Withdrawal Requests</h1>
        <p style={{ color: '#64748B', fontSize: 14 }}>Manage and process passenger wallet withdrawal requests.</p>
      </div>

      <div className="mt-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No withdrawal requests found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>Date</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>Passenger</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>Amount</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>Bank Details</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>Status</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '16px 20px', fontSize: 14, color: '#0F172A' }}>
                    {new Date(req.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{req.profiles?.full_name || 'Unknown'}</p>
                    <p style={{ fontSize: 12, color: '#64748B' }}>{req.profiles?.phone || ''}</p>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    ₦{req.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{req.bank_account?.bankName}</p>
                    <p style={{ fontSize: 12, color: '#64748B' }}>{req.bank_account?.accountNumber} • {req.bank_account?.accountName}</p>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                      background: req.status === 'approved' ? '#DCFCE7' : req.status === 'rejected' ? '#FEE2E2' : '#FEF9C3',
                      color: req.status === 'approved' ? '#16A34A' : req.status === 'rejected' ? '#DC2626' : '#854D0E'
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleAction(req.id, 'approved')}
                          disabled={actionLoading === req.id}
                          style={{ padding: '6px 12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'rejected')}
                          disabled={actionLoading === req.id}
                          style={{ padding: '6px 12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#64748B' }}>
                        Processed on {new Date(req.processed_at).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
