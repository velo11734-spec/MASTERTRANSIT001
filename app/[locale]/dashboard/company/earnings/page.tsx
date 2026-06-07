'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Wallet, RefreshCw, ArrowUpRight, DollarSign,
  Send, History, AlertTriangle, CheckCircle, CreditCard
} from 'lucide-react';

interface WalletState {
  id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  is_frozen: boolean;
}

interface WalletTx {
  id: string;
  type: 'credit' | 'debit' | 'hold' | 'release';
  amount: number;
  balance_after: number;
  description: string;
  reference: string;
  created_at: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  bank_account: { bank: string; account: string; holder: string };
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function CompanyEarningsPage() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get company details
      const { data: co } = await supabase.from('companies').select('id, name').eq('owner_id', user.id).maybeSingle();
      if (!co) {
        showToast('Company profile not found', false);
        return;
      }

      // 2. Fetch or create company wallet
      let { data: wall, error: wallErr } = await supabase
        .from('company_wallets')
        .select('*')
        .eq('company_id', co.id)
        .maybeSingle();

      if (!wall) {
        const { data: newW, error: initErr } = await supabase.from('company_wallets').insert({
          company_id: co.id,
          balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
        }).select().single();
        if (initErr) throw initErr;
        wall = newW;
      }

      setWallet(wall);

      // 3. Fetch recent wallet transactions
      if (wall) {
        const { data: tData } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', wall.id)
          .order('created_at', { ascending: false })
          .limit(20);
        setTxs(tData ?? []);
      }

      // 4. Fetch payout history
      const { data: pData } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('company_id', co.id)
        .order('created_at', { ascending: false });
      setPayouts(pData ?? []);

    } catch (err: any) {
      showToast(err.message || 'Error loading financial dashboard', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestAmount = Number(amount);
    if (!wallet) return;

    if (wallet.is_frozen) {
      showToast('Wallet is frozen. Cannot request payouts.', false);
      return;
    }
    if (isNaN(requestAmount) || requestAmount <= 0) {
      showToast('Enter a valid payout amount', false);
      return;
    }
    if (requestAmount < 10000) {
      showToast('Minimum withdrawal is ₦10,000', false);
      return;
    }
    if (requestAmount > wallet.balance) {
      showToast('Insufficient balance', false);
      return;
    }
    if (!bankName || !accountNumber || !accountHolder) {
      showToast('Please provide full settlement details', false);
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newRequest = {
        company_id: (wallet as any).company_id,
        amount: requestAmount,
        bank_account: { bank: bankName, account: accountNumber, holder: accountHolder },
        status: 'pending',
        created_by: user?.id,
      };

      const { error } = await supabase.from('payout_requests').insert(newRequest);
      if (error) throw error;

      showToast('Payout request submitted for verification');
      setAmount('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error processing request', false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px', fontFamily: "'Outfit', sans-serif" }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={26} color="#16A34A" /> Earnings & Settlements
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Withdraw partner revenue and review financial ledger accounts</p>
        </div>
        <button id="refresh-earnings-btn" onClick={loadData} style={{ background: '#0F172A', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {wallet?.is_frozen && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', fontWeight: 600 }}>
          <AlertTriangle size={18} /> Payouts frozen: This company wallet is temporarily locked by RoutePro administration.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px' }}>Loading wallet details...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '28px' }}>
          
          {/* Left Column: Wallet Overview & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Balance Card Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Available Balance</span>
                <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '8px 0 4px', color: '#16A34A' }}>{fmt(wallet?.balance ?? 0)}</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Settled funds ready for withdrawal</p>
              </div>

              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Pending Balance</span>
                <h2 style={{ fontSize: '30px', fontWeight: 800, margin: '8px 0 4px', color: '#D97706' }}>{fmt(wallet?.pending_balance ?? 0)}</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Held bookings under settlement window</p>
              </div>
            </div>

            {/* Wallet Ledger */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><History size={16} /> Wallet Ledger History</h2>
              {txs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                  <Wallet size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>No ledger transactions recorded yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                        <th style={{ padding: '10px 8px' }}>Tx Type</th>
                        <th style={{ padding: '10px 8px' }}>Description</th>
                        <th style={{ padding: '10px 8px' }}>Date</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((t) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              background: t.type === 'credit' ? '#DCFCE7' : t.type === 'debit' ? '#FEE2E2' : '#F3F4F6',
                              color: t.type === 'credit' ? '#16A34A' : t.type === 'debit' ? '#DC2626' : '#6B7280',
                              padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize'
                            }}>{t.type}</span>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#475569' }}>{t.description}</td>
                          <td style={{ padding: '12px 8px', color: '#94A3B8' }}>{fmtDate(t.created_at)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: t.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                            {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Request Payout & Withdrawal History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Payout Request Card */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Send size={16} /> Request Withdrawal</h2>
              <form onSubmit={handleSubmitPayout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelS}>Withdrawal Amount (₦)</label>
                  <input required type="number" min="10000" placeholder="Min. ₦10,000" value={amount} onChange={e => setAmount(e.target.value)} style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Destination Bank Name</label>
                  <input required type="text" placeholder="e.g. Zenith Bank" value={bankName} onChange={e => setBankName(e.target.value)} style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Account Number (10 digits)</label>
                  <input required type="text" maxLength={10} placeholder="e.g. 0123456789" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Account Holder Name</label>
                  <input required type="text" placeholder="e.g. ABC Transport Limited" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} style={inputS} />
                </div>
                <button id="payout-submit-btn" type="submit" disabled={submitting || wallet?.is_frozen} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 600, fontSize: '14px', cursor: (submitting || wallet?.is_frozen) ? 'not-allowed' : 'pointer', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {submitting ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={16} />}
                  {submitting ? 'Processing request...' : 'Submit Settlement Request'}
                </button>
              </form>
            </div>

            {/* Payout History */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>Payout Status History</h2>
              {payouts.length === 0 ? (
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>No payout requests logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {payouts.map((p) => {
                    const statusColors = p.status === 'completed'
                      ? { bg: '#DCFCE7', text: '#16A34A' }
                      : p.status === 'rejected'
                      ? { bg: '#FEE2E2', text: '#DC2626' }
                      : { bg: '#FEF9C3', text: '#CA8A04' };

                    return (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #F1F5F9', fontSize: '12px' }}>
                        <div>
                          <strong style={{ color: '#0F172A' }}>{fmt(p.amount)}</strong>
                          <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>{fmtDate(p.created_at)} ({p.bank_account?.bank})</div>
                        </div>
                        <span style={{ background: statusColors.bg, color: statusColors.text, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>{p.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelS: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' };
const inputS: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' };
