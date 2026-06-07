'use client'

import { useState, useEffect } from 'react'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWallet() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Fetch successful transactions to aggregate balance, and also list recent transactions
        const { data: payData, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (payData) {
          const totalBalance = payData
            .filter((p: any) => p.status === 'success' || p.status === 'successful')
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
          
          setBalance(totalBalance)

          const formatted = payData.map((p: any) => {
            const dateObj = new Date(p.created_at)
            return {
              id: p.reference || p.id.slice(0, 8),
              type: 'debit', // typically bookings are debits
              amount: p.amount || 0,
              date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
              desc: `Ticket payment (${p.gateway || 'Card'})`,
              status: p.status?.toLowerCase() || 'success'
            }
          })
          setTransactions(formatted)
        }
      } catch (err) {
        console.error('Error fetching wallet data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadWallet()
  }, [])

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>My Wallet</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Manage your funds, top-up, and view transaction history</p>
        </div>

        {/* Balance Card */}
        <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: 16, padding: '24px', color: 'white', marginBottom: 24, boxShadow: '0 10px 25px rgba(15,23,42,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wallet size={16} /> Available Balance
              </p>
              <p style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: '#94A3B8', marginRight: 4 }}>₦</span>
                {balance.toLocaleString()}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} color="#16A34A" /> Active
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="mt-btn-primary" style={{ background: '#16A34A', border: 'none' }}>
              <Plus size={16} /> Top Up Wallet
            </button>
            <button className="mt-btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              Withdraw
            </button>
          </div>
        </div>

        {/* Transactions list */}
        <div className="mt-card" style={{ padding: '0' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Recent Transactions</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <p style={{ padding: 24, fontSize: 13, color: '#64748B', textAlign: 'center' }}>Loading transaction history...</p>
            ) : transactions.length === 0 ? (
              <p style={{ padding: 40, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No transactions recorded yet.</p>
            ) : transactions.map((txn, i) => (
              <div key={txn.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < transactions.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: txn.type === 'credit' ? '#DCFCE7' : '#FEE2E2',
                    color: txn.type === 'credit' ? '#16A34A' : '#DC2626'
                  }}>
                    {txn.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{txn.desc}</p>
                    <p style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {txn.date}</span>
                      <span>#{txn.id}</span>
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ 
                    fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif',
                    color: txn.type === 'credit' ? '#16A34A' : '#0F172A'
                  }}>
                    {txn.type === 'credit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', textTransform: 'capitalize' }}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
