'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Building
} from 'lucide-react'

export default function CompanyWalletPage() {
  const [company, setCompany] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [payoutRequests, setPayoutRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Payout request states
  const [payoutAmount, setPayoutAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWalletData() {
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

          // Fetch Wallet
          const { data: w } = await supabase
            .from('company_wallets')
            .select('*')
            .eq('company_id', comp.id)
            .maybeSingle()
          setWallet(w)

          // Fetch Transactions
          const { data: txs } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', w?.id)
            .order('created_at', { ascending: false })
            .limit(10)
          setTransactions(txs || [])

          // Fetch payout requests
          const { data: payRequests } = await supabase
            .from('payout_requests')
            .select('*')
            .eq('company_id', comp.id)
            .order('created_at', { ascending: false })
          setPayoutRequests(payRequests || [])
        }
      } catch (err) {
        console.error('Failed to load company wallet:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWalletData()
  }, [])

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet || !company) return

    setError(null)
    setSuccess(false)
    setSubmitting(true)

    const amountNum = parseFloat(payoutAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid payout amount.')
      setSubmitting(false)
      return
    }

    if (amountNum > wallet.balance) {
      setError('Insufficient cleared funds for this payout amount.')
      setSubmitting(false)
      return
    }

    try {
      // 1. Write request to payout_requests table
      const { error: requestErr } = await supabase
        .from('payout_requests')
        .insert({
          company_id: company.id,
          amount: amountNum,
          status: 'pending'
        })

      if (requestErr) throw requestErr

      // 2. Subtract balance from wallet
      const { error: walletErr } = await supabase
        .from('company_wallets')
        .update({
          balance: wallet.balance - amountNum
        })
        .eq('id', wallet.id)

      if (walletErr) throw walletErr

      // 3. Add transactional audit trail
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_payout_request_submit',
        entity_type: 'company_wallet',
        entity_id: wallet.id,
        new_value: { amount: amountNum }
      })

      setSuccess(true)
      setPayoutAmount('')
      // Refresh wallet & payout list
      const { data: updatedWallet } = await supabase
        .from('company_wallets')
        .select('*')
        .eq('id', wallet.id)
        .single()
      setWallet(updatedWallet)

      const { data: payRequests } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
      setPayoutRequests(payRequests || [])

    } catch (err: any) {
      console.error('Payout request failed:', err)
      setError(err.message || 'Failed to submit payout request.')
    } finally {
      setSubmitting(false)
    }
  }

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
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Company Treasury & Wallet</h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>Monitor cleared ticket sales, manage payout requests, and view transaction history</p>
      </div>

      {/* Wallet overview grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Balance cards + form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Card Balance */}
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: 32,
            borderRadius: 16,
            color: '#FFFFFF',
            boxShadow: '0 10px 25px -5px rgba(15,23,42,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#16A34A', display: 'block', marginBottom: 8 }}>Available balance</span>
              <h2 style={{ fontSize: 36, fontWeight: 950, fontFamily: 'Outfit, sans-serif' }}>₦{wallet?.balance.toLocaleString() || '0'}</h2>
              <span style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, display: 'block' }}>Settles directly to: {company?.name} account</span>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
              <Wallet size={36} color="#4ADE80" />
            </div>
          </div>

          {/* Request Payout Form */}
          <div className="mt-card" style={{ padding: 28, background: '#FFFFFF', borderRadius: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>Request Payout</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Funds are instantly reserved and reviewed by platform admins for settlement.</p>

            {success && (
              <div style={{ background: '#DCFCE7', color: '#15803D', padding: 12, borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <CheckCircle2 size={16} />
                <span>Payout request submitted successfully! Funds are pending review.</span>
              </div>
            )}

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="mt-label">Payout Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step="any"
                  className="mt-input"
                  placeholder="e.g. 50000"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-btn-primary btn-press"
                style={{ padding: '12px 24px', borderRadius: 8, height: 42 }}
              >
                {submitting ? 'Requesting...' : 'Request Payout'}
              </button>
            </form>
          </div>

          {/* Transaction ledger list */}
          <div className="mt-card" style={{ padding: 28, background: '#FFFFFF', borderRadius: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>No recorded ledger entries found for this wallet yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {transactions.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                    <div>
                      <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>{tx.description || 'Transaction Entry'}</strong>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>{new Date(tx.created_at).toLocaleString()}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: tx.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                      {tx.type === 'credit' ? '+' : '-'} ₦{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payout requests list (Sidebar column) */}
        <div>
          <div className="mt-card" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12, height: '100%' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Payout History</h3>
            {payoutRequests.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94A3B8' }}>No payout requests logged.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {payoutRequests.map(r => (
                  <div key={r.id} style={{ paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13, color: '#0F172A' }}>₦{r.amount.toLocaleString()}</strong>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        textTransform: 'uppercase',
                        background: r.status === 'approved' ? '#DCFCE7' : r.status === 'rejected' ? '#FEE2E2' : '#FEF9C3',
                        color: r.status === 'approved' ? '#15803D' : r.status === 'rejected' ? '#DC2626' : '#854D0E'
                      }}>
                        {r.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: '#94A3B8', display: 'block' }}>Requested: {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
