'use client'

import { useState, useEffect } from 'react'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, ShieldAlert, Building2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { initializePaystackCheckout } from '@/lib/paystack/client'

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [thresholds, setThresholds] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [showFundModal, setShowFundModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  
  // Withdrawal state
  const [bankAccount, setBankAccount] = useState<any>(null)
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    loadWallet()
  }, [])

  async function loadWallet() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUserEmail(user.email || '')
      setBankAccount(user.user_metadata?.bank_account || null)

      const res = await fetch('/api/wallet/balance')
      const result = await res.json()

      if (result.success) {
        setWallet(result.data)
        setThresholds(result.data.thresholds)
        setTransactions(result.data.transactions)
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) < (thresholds?.minFunding || 500)) {
      alert(`Minimum funding amount is ₦${thresholds?.minFunding || 500}`)
      return
    }

    try {
      // 1. Initialize funding via our API to get a reference
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(fundAmount) })
      })
      const result = await res.json()

      if (!result.success) {
        alert(result.error)
        return
      }

      // 2. Open Paystack
      setShowFundModal(false)
      initializePaystackCheckout({
        email: result.email,
        amount: result.amount, // in kobo
        reference: result.reference,
        metadata: result.metadata,
        onSuccess: async (response) => {
          // 3. Verify on server
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference })
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            alert('Wallet funded successfully!')
            loadWallet() // Refresh balance
          } else {
            alert('Payment verification failed. Please contact support.')
          }
        },
        onClose: () => {
          console.log('Payment closed by user')
        }
      })
      
    } catch (err) {
      console.error(err)
      alert('An error occurred. Please try again.')
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawError('')
    setWithdrawSuccess('')

    const amount = Number(withdrawAmount)
    if (!amount || isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount')
      return
    }

    if (!bankAccount?.accountNumber || !bankAccount?.bankName) {
      setWithdrawError('Please complete your bank account details in your profile first.')
      return
    }

    if (amount > wallet.spendableBalance) {
      setWithdrawError('Insufficient spendable balance')
      return
    }

    setIsWithdrawing(true)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bankAccount })
      })
      const result = await res.json()

      if (!res.ok) {
        setWithdrawError(result.error || 'Withdrawal failed')
      } else {
        setWithdrawSuccess('Withdrawal request submitted successfully! It will be reviewed shortly.')
        setWithdrawAmount('')
        loadWallet()
        setTimeout(() => setShowWithdrawModal(false), 3000)
      }
    } catch (err) {
      console.error(err)
      setWithdrawError('An error occurred.')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const renderIntentIcon = (intent: string) => {
    switch (intent) {
      case 'WALLET_TOP_UP':
      case 'REFUND_CREDIT':
        return <ArrowDownLeft size={20} />
      case 'WALLET_DEBIT':
      case 'WITHDRAWAL':
        return <ArrowUpRight size={20} />
      default:
        return <RefreshCw size={20} />
    }
  }

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'WALLET_TOP_UP':
      case 'REFUND_CREDIT':
        return { bg: '#DCFCE7', color: '#16A34A', sign: '+' }
      case 'WALLET_DEBIT':
      case 'WITHDRAWAL':
        return { bg: '#FEE2E2', color: '#DC2626', sign: '-' }
      default:
        return { bg: '#F1F5F9', color: '#64748B', sign: '' }
    }
  }

  const formatIntentName = (intent: string) => {
    if (!intent) return 'Transaction'
    return intent.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading && !wallet) {
    return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>Loading wallet...</div>
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>My Wallet</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Manage your funds, top-up, and request withdrawals</p>
          </div>
          {wallet?.isFrozen && (
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEE2E2', color: '#DC2626', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
               <ShieldAlert size={16} /> Wallet Frozen
             </div>
          )}
        </div>

        {/* Dual Balance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          
          {/* Spendable Balance */}
          <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: 16, padding: '24px', color: 'white', boxShadow: '0 10px 25px rgba(15,23,42,0.1)' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={16} /> Spendable Balance
            </p>
            <p style={{ fontSize: 36, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', marginBottom: 24 }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: '#94A3B8', marginRight: 4 }}>₦</span>
              {(wallet?.spendableBalance || 0).toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="mt-btn-primary" 
                style={{ background: '#16A34A', border: 'none', flex: 1 }}
                onClick={() => setShowFundModal(true)}
                disabled={wallet?.isFrozen}
              >
                <Plus size={16} /> Fund Wallet
              </button>
              <button 
                className="mt-btn-outline" 
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', flex: 1 }}
                onClick={() => setShowWithdrawModal(true)}
                disabled={!wallet?.withdrawalEligible || wallet?.isFrozen}
                title={!wallet?.withdrawalEligible ? `Minimum withdrawal balance is ₦${thresholds?.withdrawalThreshold?.toLocaleString()}` : ''}
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Refund Balance */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={16} /> Refund Balance
            </p>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', marginBottom: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#94A3B8', marginRight: 4 }}>₦</span>
              {(wallet?.refundBalance || 0).toLocaleString()}
            </p>
            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, background: '#F1F5F9', padding: '10px 12px', borderRadius: 8 }}>
              This balance is exclusively for promotional credits and minor refunds. It is automatically applied to your next checkout.
            </p>
          </div>

        </div>

        {/* Transactions list */}
        <div className="mt-card" style={{ padding: '0' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Transaction History</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {!transactions || transactions.length === 0 ? (
              <p style={{ padding: 40, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>No transactions recorded yet.</p>
            ) : transactions.map((txn, i) => {
              const style = getIntentColor(txn.transaction_intent)
              const dateObj = new Date(txn.created_at)
              return (
                <div key={txn.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < transactions.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: style.bg, color: style.color
                    }}>
                      {renderIntentIcon(txn.transaction_intent)}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{formatIntentName(txn.transaction_intent)}</p>
                      <p style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {dateObj.toLocaleDateString()}</span>
                        <span>{txn.description || `Ref: ${txn.linked_entity_id?.slice(0,8)}`}</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ 
                      fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: style.color
                    }}>
                      {style.sign}₦{Math.abs(txn.amount).toLocaleString()}
                    </p>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', textTransform: 'capitalize' }}>{txn.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Fund Modal */}
      {showFundModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="mt-card fade-in" style={{ width: '90%', maxWidth: 400, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Fund Wallet</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Enter the amount you wish to add to your wallet. Minimum ₦{thresholds?.minFunding}.</p>
            
            <form onSubmit={handleFundWallet}>
              <div style={{ marginBottom: 20 }}>
                <label className="mt-label">Amount (₦)</label>
                <input 
                  type="number" 
                  value={fundAmount} 
                  onChange={e => setFundAmount(e.target.value)} 
                  className="mt-input" 
                  placeholder="e.g. 5000" 
                  autoFocus
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowFundModal(false)} className="mt-btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="mt-btn-primary" style={{ flex: 1 }}>Proceed to Pay</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="mt-card fade-in" style={{ width: '90%', maxWidth: 420, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Withdraw Funds</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Withdraw your spendable balance directly to your bank account.</p>
            
            {withdrawError && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{withdrawError}</div>}
            {withdrawSuccess && <div style={{ background: '#DCFCE7', color: '#15803D', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{withdrawSuccess}</div>}

            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: 20 }}>
                <label className="mt-label">Available Balance</label>
                <div style={{ background: '#F1F5F9', padding: '12px 16px', borderRadius: 8, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  ₦{(wallet?.spendableBalance || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="mt-label">Amount to Withdraw (₦)</label>
                <input 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                  className="mt-input" 
                  placeholder="e.g. 10000" 
                  max={wallet?.spendableBalance}
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="mt-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bank Account</span>
                  <a href="/en/dashboard/profile" style={{ color: '#2563EB', textTransform: 'none' }}>Edit</a>
                </label>
                {bankAccount?.accountNumber ? (
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={16} color="#2563EB" />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{bankAccount.bankName}</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>{bankAccount.accountNumber} • {bankAccount.accountName}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#FEF9C3', color: '#854D0E', padding: 12, borderRadius: 8, fontSize: 13 }}>
                    Please add your bank account details in your profile before withdrawing.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="mt-btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="mt-btn-primary" style={{ flex: 1 }} disabled={isWithdrawing || !bankAccount?.accountNumber}>
                  {isWithdrawing ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
