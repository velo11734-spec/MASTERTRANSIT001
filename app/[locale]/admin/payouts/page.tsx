'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  RefreshCw, Building2, CheckCircle, XCircle, Lock, Unlock,
  Clock, DollarSign, AlertTriangle, ChevronRight, X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  balance?: number;
  status?: string;
  last_payout_at?: string;
}

interface PayoutRequest {
  id: string;
  company_id: string;
  amount: number;
  status: string;
  created_at: string;
  company_name?: string;
}

interface Settlement {
  id: string;
  company_id: string;
  amount: number;
  status: string;
  created_at: string;
  company_name?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n ?? 0);
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

async function logAudit(action: string, targetId: string, meta?: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      action, target_type: 'payout', target_id: targetId,
      performed_by: user?.id ?? null, metadata: meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const [companies, setCompanies]               = useState<Company[]>([]);
  const [requests, setRequests]                 = useState<PayoutRequest[]>([]);
  const [settlements, setSettlements]           = useState<Settlement[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [globalFreeze, setGlobalFreeze]         = useState(false);
  const [freezeLoading, setFreezeLoading]       = useState(false);
  const [actionLoading, setActionLoading]       = useState<string | null>(null);
  const [toast, setToast]                       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Companies
      const { data: co } = await supabase.from('companies').select('*').order('name');
      setCompanies(co ?? []);

      // Payout requests (graceful)
      const { data: pr } = await supabase.from('payout_requests').select('*').order('created_at', { ascending: false });
      const prData = pr ?? [];
      const coMap: Record<string, string> = {};
      (co ?? []).forEach((c: Company) => { coMap[c.id] = c.name; });
      setRequests(prData.map((r: PayoutRequest) => ({ ...r, company_name: coMap[r.company_id] ?? '—' })));

      // Settlements (graceful)
      const { data: sl } = await supabase.from('payouts').select('*').order('created_at', { ascending: false }).limit(20);
      setSettlements((sl ?? []).map((s: Settlement) => ({ ...s, company_name: coMap[s.company_id] ?? '—' })));

      // Global freeze
      const { data: pf } = await supabase.from('platform_settings').select('value').eq('key', 'payout_freeze').maybeSingle();
      setGlobalFreeze(pf?.value === 'true' || pf?.value === true);
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load data', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const toggleGlobalFreeze = async () => {
    setFreezeLoading(true);
    try {
      const newVal = !globalFreeze;
      await supabase.from('platform_settings').upsert({ key: 'payout_freeze', value: String(newVal) }, { onConflict: 'key' });
      await logAudit(newVal ? 'freeze_all_payouts' : 'release_all_payouts', 'platform_settings');
      setGlobalFreeze(newVal);
      showToast(newVal ? 'All payouts frozen' : 'Payouts released', true);
    } catch (err: any) {
      showToast(err.message ?? 'Action failed', false);
    } finally {
      setFreezeLoading(false);
    }
  };

  const approveRequest = async (req: PayoutRequest) => {
    setActionLoading(req.id + '_approve');
    try {
      // 1. Get company wallet
      const { data: wallet } = await supabase
        .from('company_wallets')
        .select('*')
        .eq('company_id', req.company_id)
        .maybeSingle();

      if (!wallet) throw new Error('Company wallet not found');
      if (Number(wallet.balance) < req.amount) {
        throw new Error('Insufficient wallet balance');
      }

      // 2. Update payout request status to completed
      await supabase.from('payout_requests').update({ status: 'completed' }).eq('id', req.id);

      // 3. Debit company wallet
      const newBal = Number(wallet.balance) - req.amount;
      const newWithdrawn = Number(wallet.total_withdrawn) + req.amount;
      await supabase.from('company_wallets').update({
        balance: newBal,
        total_withdrawn: newWithdrawn
      }).eq('id', wallet.id);

      // 4. Create wallet transaction ledger entry
      const ref = `PAY-${req.id.slice(0,8)}-${Date.now()}`;
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        type: 'debit',
        amount: req.amount,
        balance_after: newBal,
        description: `Payout Processed: ${ref}`,
        reference: ref,
        payout_id: req.id
      });

      // 5. Create payouts ledger entry
      const bankAcc = (req as any).bank_account || { bank: 'Settled Transfer', account: 'N/A' };
      await supabase.from('payouts').insert({
        company_id: req.company_id,
        amount: req.amount,
        net_amount: req.amount,
        payout_request_id: req.id,
        reference: ref,
        bank_account: bankAcc,
        status: 'completed',
        paid_at: new Date().toISOString()
      });

      await logAudit('approve_payout', req.id, { company: req.company_name, amount: req.amount });
      showToast('Payout approved and settled from company wallet', true);
      fetchAll();
    } catch (err: any) {
      showToast(err.message ?? 'Approve failed', false);
    } finally { setActionLoading(null); }
  };

  const rejectRequest = async (req: PayoutRequest) => {
    setActionLoading(req.id + '_reject');
    try {
      await supabase.from('payout_requests').update({ status: 'rejected' }).eq('id', req.id);
      await logAudit('reject_payout', req.id, { company: req.company_name, amount: req.amount });
      showToast('Payout rejected', true);
      fetchAll();
    } catch (err: any) {
      showToast(err.message ?? 'Reject failed', false);
    } finally { setActionLoading(null); }
  };

  const freezeCompany = async (co: Company) => {
    setActionLoading(co.id + '_freeze');
    try {
      await supabase.from('companies').update({ status: 'frozen' }).eq('id', co.id);
      await logAudit('freeze_company_funds', co.id, { company: co.name });
      showToast(`${co.name} funds frozen`, true);
      fetchAll();
    } catch (err: any) {
      showToast(err.message ?? 'Freeze failed', false);
    } finally { setActionLoading(null); }
  };

  const releaseCompany = async (co: Company) => {
    setActionLoading(co.id + '_release');
    try {
      await supabase.from('companies').update({ status: 'active' }).eq('id', co.id);
      await logAudit('release_company_funds', co.id, { company: co.name });
      showToast(`${co.name} funds released`, true);
      fetchAll();
    } catch (err: any) {
      showToast(err.message ?? 'Release failed', false);
    } finally { setActionLoading(null); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontSize: 14, fontWeight: 500 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0 }}>Payout Management</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>Manage company balances, payout requests, and settlements</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={toggleGlobalFreeze} disabled={freezeLoading} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: globalFreeze ? '#DC2626' : '#CA8A04', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>
            {globalFreeze ? <Unlock size={15}/> : <Lock size={15}/>}
            {globalFreeze ? 'Release All Payouts' : 'Freeze All Payouts'}
          </button>
          <button onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            <RefreshCw size={15}/> Refresh
          </button>
        </div>
      </div>

      {globalFreeze && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', fontWeight: 500 }}>
          <Lock size={16}/> Global payout freeze is ACTIVE — no payouts can be processed.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 16 }}>Loading payout data…</p>
        </div>
      ) : (
        <>
          {/* Company Balances Table */}
          <SectionCard title="Company Balances" icon={<Building2 size={18}/>}>
            {companies.length === 0 ? (
              <EmptyState icon={<Building2 size={36}/>} label="No companies found" />
            ) : (
              <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Company', 'Balance', 'Status', 'Last Payout', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companies.map((co, i) => (
                    <tr key={co.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                            <Building2 size={16}/>
                          </div>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{co.name}</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#16A34A' }}>{fmt(co.balance ?? 0)}</td>
                      <td style={tdStyle}>
                        <StatusBadge status={co.status ?? 'active'}/>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748B' }}>{fmtDate(co.last_payout_at ?? '')}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {co.status === 'frozen' ? (
                            <IconBtn icon={<Unlock size={13}/>} label="Release" color="#16A34A" loading={actionLoading === co.id + '_release'} onClick={() => releaseCompany(co)}/>
                          ) : (
                            <IconBtn icon={<Lock size={13}/>} label="Freeze" color="#DC2626" loading={actionLoading === co.id + '_freeze'} onClick={() => freezeCompany(co)}/>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            )}
          </SectionCard>

          {/* Payout Requests */}
          <SectionCard title="Payout Requests" icon={<DollarSign size={18}/>} style={{ marginTop: 24 }}>
            {requests.length === 0 ? (
              <EmptyState icon={<Clock size={36}/>} label="No payout requests" />
            ) : (
              <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Company', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#0F172A' }}>{r.company_name}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#16A34A' }}>{fmt(r.amount)}</td>
                      <td style={tdStyle}><StatusBadge status={r.status}/></td>
                      <td style={{ ...tdStyle, color: '#64748B' }}>{fmtDate(r.created_at)}</td>
                      <td style={tdStyle}>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <IconBtn icon={<CheckCircle size={13}/>} label="Approve" color="#16A34A" loading={actionLoading === r.id + '_approve'} onClick={() => approveRequest(r)}/>
                            <IconBtn icon={<XCircle size={13}/>} label="Reject" color="#DC2626" loading={actionLoading === r.id + '_reject'} onClick={() => rejectRequest(r)}/>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            )}
          </SectionCard>

          {/* Settlement History */}
          <SectionCard title="Settlement History" icon={<ChevronRight size={18}/>} style={{ marginTop: 24 }}>
            {settlements.length === 0 ? (
              <EmptyState icon={<DollarSign size={36}/>} label="No settlement history" />
            ) : (
              <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Company', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#0F172A' }}>{s.company_name}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#16A34A' }}>{fmt(s.amount)}</td>
                      <td style={tdStyle}><StatusBadge status={s.status}/></td>
                      <td style={{ ...tdStyle, color: '#64748B' }}>{fmtDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            )}
          </SectionCard>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, icon, children, style: extraStyle }: { title: string; icon: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', ...extraStyle }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#16A34A' }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    active:   { bg: '#DCFCE7', color: '#16A34A' },
    approved: { bg: '#DCFCE7', color: '#16A34A' },
    completed:{ bg: '#DCFCE7', color: '#16A34A' },
    pending:  { bg: '#FEF9C3', color: '#CA8A04' },
    frozen:   { bg: '#DBEAFE', color: '#2563EB' },
    rejected: { bg: '#FEE2E2', color: '#DC2626' },
    failed:   { bg: '#FEE2E2', color: '#DC2626' },
  };
  const { bg, color } = map[status?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return <span style={{ background: bg, color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{status}</span>;
}

function IconBtn({ icon, label, color, onClick, loading }: { icon: React.ReactNode; label: string; color: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} title={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: `1.5px solid ${color}`, borderRadius: 6, background: 'transparent', color, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500, opacity: loading ? 0.6 : 1 }}>
      {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }}/> : icon} {label}
    </button>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>
      <div style={{ opacity: 0.4, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{label}</p>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '14px 16px' };
