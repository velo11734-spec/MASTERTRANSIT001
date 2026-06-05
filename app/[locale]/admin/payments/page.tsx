'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  RefreshCw, Search, DollarSign, TrendingUp, AlertTriangle,
  RotateCcw, Flag, X, CheckCircle, XCircle, Clock, Edit2, Save,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  reference: string;
  user_id: string;
  amount: number;
  status: string;
  gateway: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n ?? 0);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  successful: { bg: '#DCFCE7', color: '#16A34A' },
  success:    { bg: '#DCFCE7', color: '#16A34A' },
  completed:  { bg: '#DCFCE7', color: '#16A34A' },
  pending:    { bg: '#FEF9C3', color: '#CA8A04' },
  failed:     { bg: '#FEE2E2', color: '#DC2626' },
  refunded:   { bg: '#DBEAFE', color: '#2563EB' },
};
const ss = (s: string) => STATUS_COLOR[s?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
const isSuccess = (s: string) => ['successful', 'success', 'completed'].includes(s?.toLowerCase());

async function logAudit(action: string, targetId: string, meta?: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      action, target_type: 'payment', target_id: targetId,
      performed_by: user?.id ?? null, metadata: meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Commission rate
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionInput, setCommissionInput] = useState('');

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch payments ─────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments(data ?? []);
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load payments', false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch commission ────────────────────────────────────────────────────────

  const fetchCommission = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'commission_rate')
        .maybeSingle();
      if (data) setCommissionRate(data.value ?? '');
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchCommission();
  }, [fetchPayments, fetchCommission]);

  // ── Derived stats ───────────────────────────────────────────────────────────

  const totalRevenue = payments.filter((p) => isSuccess(p.status)).reduce((a, p) => a + (p.amount ?? 0), 0);
  const totalPending = payments.filter((p) => p.status?.toLowerCase() === 'pending').reduce((a, p) => a + (p.amount ?? 0), 0);
  const totalFailed  = payments.filter((p) => p.status?.toLowerCase() === 'failed').reduce((a, p) => a + (p.amount ?? 0), 0);
  const totalRefunded = payments.filter((p) => p.status?.toLowerCase() === 'refunded').reduce((a, p) => a + (p.amount ?? 0), 0);

  // ── Filter ──────────────────────────────────────────────────────────────────

  const STATUS_TABS = ['All', 'Successful', 'Pending', 'Failed', 'Refunded'];
  const filtered = payments.filter((p) => {
    const matchSearch = !search || p.reference?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // ── Actions ─────────────────────────────────────────────────────────────────

  const refundPayment = async (p: Payment) => {
    setActionLoading(p.id + '_refund');
    try {
      // Try inserting a refund_request; fall back to updating status
      const { error: reqErr } = await supabase.from('refund_requests').insert({
        payment_id: p.id, user_id: p.user_id, amount: p.amount,
        reason: 'Admin-initiated refund', status: 'pending',
        created_at: new Date().toISOString(),
      });
      if (reqErr) {
        // Fallback: update payment status
        await supabase.from('payments').update({ status: 'refunded' }).eq('id', p.id);
      }
      await logAudit('refund_payment', p.id, { reference: p.reference, amount: p.amount });
      showToast(`Refund initiated for ${p.reference}`, true);
      fetchPayments();
    } catch (err: any) {
      showToast(err.message ?? 'Refund failed', false);
    } finally {
      setActionLoading(null);
    }
  };

  const flagSuspicious = async (p: Payment) => {
    setActionLoading(p.id + '_flag');
    try {
      await supabase.from('fraud_flags').insert({
        target_type: 'payment', target_id: p.id,
        reason: 'Flagged as suspicious by admin',
        created_at: new Date().toISOString(),
      });
      await logAudit('flag_suspicious_payment', p.id, { reference: p.reference });
      showToast(`Payment ${p.reference} flagged`, true);
    } catch (err: any) {
      showToast(err.message ?? 'Flag failed', false);
    } finally {
      setActionLoading(null);
    }
  };

  const saveCommission = async () => {
    try {
      const { error } = await supabase.from('platform_settings')
        .upsert({ key: 'commission_rate', value: commissionInput }, { onConflict: 'key' });
      if (error) throw error;
      await logAudit('update_commission_rate', 'platform_settings', { old: commissionRate, new: commissionInput });
      setCommissionRate(commissionInput);
      setEditingCommission(false);
      showToast('Commission rate updated', true);
    } catch (err: any) {
      showToast(err.message ?? 'Update failed', false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px', fontFamily: 'Inter, sans-serif' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#16A34A' : '#DC2626',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontSize: 14, fontWeight: 500,
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0 }}>Payment Management</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>Track revenue, refunds, and suspicious transactions</p>
        </div>
        <button onClick={fetchPayments} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue',    value: fmt(totalRevenue),  icon: <TrendingUp size={20}/>,  bg: '#DCFCE7', c: '#16A34A' },
          { label: 'Pending',          value: fmt(totalPending),  icon: <Clock size={20}/>,       bg: '#FEF9C3', c: '#CA8A04' },
          { label: 'Failed',           value: fmt(totalFailed),   icon: <XCircle size={20}/>,     bg: '#FEE2E2', c: '#DC2626' },
          { label: 'Refunded',         value: fmt(totalRefunded), icon: <RotateCcw size={20}/>,   bg: '#DBEAFE', c: '#2563EB' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>{s.value}</p>
              </div>
              <div style={{ background: s.bg, color: s.c, borderRadius: 10, padding: 10 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Commission Rate Card */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <DollarSign size={20} color="#16A34A" />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Platform Commission Rate</p>
          {editingCommission ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <input
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                placeholder="e.g. 5.5"
                style={{ padding: '8px 12px', border: '1.5px solid #16A34A', borderRadius: 8, fontSize: 14, outline: 'none', width: 120 }}
              />
              <span style={{ color: '#64748B', fontSize: 14 }}>%</span>
              <button onClick={saveCommission} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Save size={14} /> Save
              </button>
              <button onClick={() => setEditingCommission(false)} style={{ padding: '8px 14px', background: '#F1F5F9', color: '#0F172A', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
              {commissionRate ? `${commissionRate}%` : '—'}
            </p>
          )}
        </div>
        {!editingCommission && (
          <button onClick={() => { setCommissionInput(commissionRate); setEditingCommission(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F1F5F9', color: '#0F172A', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            <Edit2 size={14} /> Edit
          </button>
        )}
      </div>

      {/* Table Card */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference…"
              style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => (
              <button key={tab} onClick={() => setStatusFilter(tab)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: statusFilter === tab ? '#0F172A' : '#F1F5F9', color: statusFilter === tab ? '#fff' : '#64748B', transition: 'all 0.15s' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 12 }}>Loading payments…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <DollarSign size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No payments found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Reference', 'Amount', 'Gateway', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const style = ss(p.status);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{p.reference ?? '—'}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#16A34A' }}>{fmt(p.amount)}</td>
                      <td style={{ padding: '14px 16px', color: '#475569', textTransform: 'capitalize' }}>{p.gateway ?? '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: style.bg, color: style.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{fmtDate(p.created_at)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ABtn icon={<RotateCcw size={13}/>} label="Refund" color="#2563EB" loading={actionLoading === p.id + '_refund'} onClick={() => refundPayment(p)} />
                          <ABtn icon={<Flag size={13}/>} label="Flag" color="#DC2626" loading={actionLoading === p.id + '_flag'} onClick={() => flagSuspicious(p)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ABtn({ icon, label, color, onClick, loading }: { icon: React.ReactNode; label: string; color: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} title={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: `1.5px solid ${color}`, borderRadius: 6, background: 'transparent', color, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500, opacity: loading ? 0.6 : 1 }}>
      {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : icon} {label}
    </button>
  );
}
