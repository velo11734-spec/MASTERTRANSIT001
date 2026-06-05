'use client'

import { useState } from 'react'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, Bus, CheckCircle2 } from 'lucide-react'

const transactions = [
  { id: 'TXN-001', type: 'credit', amount: 50000, date: 'May 25, 2024', desc: 'Wallet Top Up', status: 'success' },
  { id: 'TXN-002', type: 'debit', amount: 8250, date: 'May 25, 2024', desc: 'Ticket BK001 (Lagos - Abuja)', status: 'success' },
  { id: 'TXN-003', type: 'credit', amount: 4200, date: 'Apr 12, 2024', desc: 'Refund for cancelled trip BK003', status: 'success' },
  { id: 'TXN-004', type: 'debit', amount: 4200, date: 'Apr 10, 2024', desc: 'Ticket BK003 (Lagos - Ibadan)', status: 'success' },
]

export default function WalletPage() {
  const [balance] = useState(45950)

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
            {transactions.map((txn, i) => (
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
