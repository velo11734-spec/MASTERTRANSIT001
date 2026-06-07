'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  RefreshCw, Search, X, AlertCircle, CheckCircle,
  Clock, Shield, ChevronDown, DollarSign, User,
  FileText, MessageSquare, Scale, CreditCard
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Dispute {
  id: string;
  reference?: string;
  subject?: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  complainant_id?: string;
  booking_id?: string;
  assigned_to?: string;
  resolution?: string;
  evidence?: string[] | null;
  complainant_name?: string;
}

interface RefundRequest {
  id: string;
  booking_id: string;
  user_id: string;
  user_name?: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  admin_note: string | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  full_name?: string;
  email?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  low:      { bg: '#DCFCE7', color: '#16A34A' },
  medium:   { bg: '#FEF9C3', color: '#CA8A04' },
  high:     { bg: '#FEF3C7', color: '#D97706' },
  critical: { bg: '#FEE2E2', color: '#DC2626' },
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open:          { bg: '#DBEAFE', color: '#2563EB' },
  investigating: { bg: '#FEF9C3', color: '#CA8A04' },
  resolved:      { bg: '#DCFCE7', color: '#16A34A' },
  closed:        { bg: '#F3F4F6', color: '#6B7280' },
  escalated:     { bg: '#FEE2E2', color: '#DC2626' },
};

const REFUND_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#FEF9C3', color: '#CA8A04' },
  processing: { bg: '#DBEAFE', color: '#2563EB' },
  approved:   { bg: '#DCFCE7', color: '#16A34A' },
  completed:  { bg: '#DCFCE7', color: '#16A34A' },
  rejected:   { bg: '#FEE2E2', color: '#DC2626' },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

async function logAudit(action: string, targetId: string, meta?: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      actor_id: user?.id,
      actor_email: user?.email,
      action,
      entity_type: 'dispute_or_refund',
      entity_id: targetId,
      new_value: meta ?? {},
    });
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DisputesPage() {
  const [activeTab, setActiveTab]     = useState<'disputes' | 'refunds'>('disputes');
  const [disputes, setDisputes]       = useState<Dispute[]>([]);
  const [refunds, setRefunds]         = useState<RefundRequest[]>([]);
  const [admins, setAdmins]           = useState<AdminUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selection states
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [selectedRefund, setSelectedRefund]   = useState<RefundRequest | null>(null);
  const [toast, setToast]                     = useState<{ msg: string; ok: boolean } | null>(null);

  // Dispute Modal fields
  const [newStatus, setNewStatus]         = useState('');
  const [resolution, setResolution]       = useState('');
  const [assignedTo, setAssignedTo]       = useState('');
  const [refundAmount, setRefundAmount]   = useState('');
  const [savingDispute, setSavingDispute] = useState(false);

  // Refund Modal fields
  const [refundAdminNote, setRefundAdminNote] = useState('');
  const [savingRefund, setSavingRefund]       = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDisputes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const raw: Dispute[] = data ?? [];

      const ids = [...new Set(raw.map((d) => d.complainant_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? 'Unknown'; });
      }

      setDisputes(raw.map((d) => ({ ...d, complainant_name: nameMap[d.complainant_id ?? ''] ?? 'Unknown' })));
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load disputes', false);
    }
  }, []);

  const fetchRefunds = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const raw: RefundRequest[] = data ?? [];

      const uids = [...new Set(raw.map((r) => r.user_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (uids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', uids);
        (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? 'Passenger'; });
      }

      setRefunds(raw.map((r) => ({ ...r, user_name: nameMap[r.user_id] ?? 'Passenger' })));
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load refunds', false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'admin');
      setAdmins(data ?? []);
    } catch (_) {}
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDisputes(), fetchRefunds(), fetchAdmins()]);
    setLoading(false);
  }, [fetchDisputes, fetchRefunds, fetchAdmins]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const saveDispute = async () => {
    if (!selectedDispute) return;
    setSavingDispute(true);
    try {
      const updates: Partial<Dispute> = {
        status: newStatus,
        resolution: resolution,
        assigned_to: assignedTo || undefined,
      };
      const { error } = await supabase.from('disputes').update(updates).eq('id', selectedDispute.id);
      if (error) throw error;

      // Create refund request if specified
      if (refundAmount && parseFloat(refundAmount) > 0) {
        await supabase.from('refund_requests').insert({
          booking_id: selectedDispute.booking_id || '00000000-0000-0000-0000-000000000000',
          user_id: selectedDispute.complainant_id,
          amount: parseFloat(refundAmount),
          reason: `Dispute Resolution Ref: ${selectedDispute.reference || selectedDispute.id.slice(0,8)}`,
          status: 'pending',
        });
      }

      await logAudit('update_dispute', selectedDispute.id, {
        reference: selectedDispute.reference, new_status: newStatus, refund_amount: refundAmount
      });

      showToast('Dispute updated successfully');
      setSelectedDispute(null);
      loadData();
    } catch (err: any) {
      showToast(err.message ?? 'Save failed', false);
    } finally {
      setSavingDispute(false);
    }
  };

  const processRefund = async (status: 'completed' | 'rejected') => {
    if (!selectedRefund) return;
    setSavingRefund(true);
    try {
      const updates = {
        status,
        admin_note: refundAdminNote,
        processed_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('refund_requests').update(updates).eq('id', selectedRefund.id);
      if (error) throw error;

      if (status === 'completed') {
        // 1. Fetch or initialize user wallet
        const { data: wallet } = await supabase
          .from('passenger_wallets')
          .select('id, balance')
          .eq('user_id', selectedRefund.user_id)
          .maybeSingle();

        let walletId = wallet?.id;
        let newBalance = (Number(wallet?.balance) || 0) + Number(selectedRefund.amount);

        if (!wallet) {
          const { data: newW } = await supabase.from('passenger_wallets').insert({
            user_id: selectedRefund.user_id,
            balance: selectedRefund.amount,
            total_funded: selectedRefund.amount,
          }).select().single();
          walletId = newW?.id;
          newBalance = Number(selectedRefund.amount);
        } else {
          await supabase.from('passenger_wallets').update({
            balance: newBalance,
          }).eq('id', walletId);
        }

        // 2. Insert ledger transaction
        await supabase.from('passenger_wallet_transactions').insert({
          wallet_id: walletId,
          type: 'refund',
          amount: selectedRefund.amount,
          balance_after: newBalance,
          description: `Refund Approved: ${selectedRefund.reason}`,
          reference: `REF-${selectedRefund.id.slice(0, 8)}-${Date.now()}`,
          booking_id: selectedRefund.booking_id,
        });

        // 3. Log to platform treasury (Debit treasury or commission reduction)
        await supabase.from('platform_treasury').insert({
          transaction_type: 'commission',
          amount: -Number(selectedRefund.amount),
          source_id: selectedRefund.id,
          source_type: 'refund',
          description: `Refund Debit: ${selectedRefund.reason}`,
        });
      }

      await logAudit(`refund_${status}`, selectedRefund.id, {
        amount: selectedRefund.amount, user_id: selectedRefund.user_id
      });

      showToast(`Refund Request ${status}`);
      setSelectedRefund(null);
      loadData();
    } catch (err: any) {
      showToast(err.message ?? 'Process failed', false);
    } finally {
      setSavingRefund(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const filteredDisputes = disputes.filter((d) => {
    const matchSearch = !search ||
      d.reference?.toLowerCase().includes(search.toLowerCase()) ||
      d.subject?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || d.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const filteredRefunds = refunds.filter((r) => {
    const matchSearch = !search || r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0 }}>Disputes & Refunds Hub</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>Resolve user claims, issue refunds, and adjust transactions</p>
        </div>
        <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <RefreshCw size={15}/> Refresh
        </button>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '24px', gap: '20px' }}>
        <button id="tab-select-disputes" onClick={() => { setActiveTab('disputes'); setStatusFilter('All'); }} style={{ background: 'transparent', border: 'none', borderBottom: activeTab === 'disputes' ? '3px solid #16A34A' : 'none', color: activeTab === 'disputes' ? '#0F172A' : '#64748B', fontSize: '15px', fontWeight: 700, padding: '10px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={18} /> Disputes ({disputes.length})
        </button>
        <button id="tab-select-refunds" onClick={() => { setActiveTab('refunds'); setStatusFilter('All'); }} style={{ background: 'transparent', border: 'none', borderBottom: activeTab === 'refunds' ? '3px solid #16A34A' : 'none', color: activeTab === 'refunds' ? '#0F172A' : '#64748B', fontSize: '15px', fontWeight: 700, padding: '10px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} /> Refund Requests ({refunds.length})
        </button>
      </div>

      {/* Main Table card */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        
        {/* Table Filters */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={activeTab === 'disputes' ? "Search disputes..." : "Search refund reasons..."}
              style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}/>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {activeTab === 'disputes' ? (
              ['All', 'Open', 'Investigating', 'Resolved', 'Escalated', 'Closed'].map((tab) => (
                <button key={tab} onClick={() => setStatusFilter(tab)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: statusFilter === tab ? '#0F172A' : '#F1F5F9', color: statusFilter === tab ? '#fff' : '#64748B' }}>
                  {tab}
                </button>
              ))
            ) : (
              ['All', 'Pending', 'Completed', 'Rejected'].map((tab) => (
                <button key={tab} onClick={() => setStatusFilter(tab)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: statusFilter === tab ? '#0F172A' : '#F1F5F9', color: statusFilter === tab ? '#fff' : '#64748B' }}>
                  {tab}
                </button>
              ))
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }}/>
            <p style={{ marginTop: 12 }}>Loading claims data…</p>
          </div>
        ) : activeTab === 'disputes' ? (
          // Disputes Grid
          filteredDisputes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}><Scale size={40} style={{ opacity: 0.3 }} /><p>No disputes found</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Case Ref', 'Subject', 'Complainant', 'Priority', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDisputes.map((d) => {
                    const ps = PRIORITY_STYLE[d.priority?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
                    const st = STATUS_STYLE[d.status?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => { setSelectedDispute(d); setNewStatus(d.status); setResolution(d.resolution ?? ''); setAssignedTo(d.assigned_to ?? ''); setRefundAmount(''); }}>
                        <td style={tdStyle}>{d.reference ?? d.id.slice(0, 8)}</td>
                        <td style={tdStyle}>{d.subject}</td>
                        <td style={tdStyle}>{d.complainant_name}</td>
                        <td style={tdStyle}><span style={{ background: ps.bg, color: ps.color, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{d.priority}</span></td>
                        <td style={tdStyle}><span style={{ background: st.bg, color: st.color, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{d.status}</span></td>
                        <td style={tdStyle}>{fmtDate(d.created_at)}</td>
                        <td style={tdStyle}>
                          <button style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Manage</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // Refunds Grid
          filteredRefunds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}><CreditCard size={40} style={{ opacity: 0.3 }} /><p>No refund requests found</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Passenger', 'Amount', 'Reason', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map((r) => {
                    const rst = REFUND_STATUS_STYLE[r.status?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => { setSelectedRefund(r); setRefundAdminNote(r.admin_note ?? ''); }}>
                        <td style={tdStyle}>{r.user_name}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#16A34A' }}>{fmt(r.amount)}</td>
                        <td style={tdStyle}>{r.reason}</td>
                        <td style={tdStyle}><span style={{ background: rst.bg, color: rst.color, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{r.status}</span></td>
                        <td style={tdStyle}>{fmtDate(r.created_at)}</td>
                        <td style={tdStyle}>
                          <button style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Review</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Dispute Modal */}
      {selectedDispute && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Resolve Dispute claim: {selectedDispute.reference}</h2>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>{selectedDispute.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelS}>Dispute Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={selectS}>
                  {['open', 'investigating', 'resolved', 'closed', 'escalated'].map((st) => (
                    <option key={st} value={st}>{st.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelS}>Assign To Admin</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={selectS}>
                  <option value="">— Unassigned —</option>
                  {admins.map(a => <option key={a.id} value={a.id}>{a.full_name ?? a.email}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Resolution Summary Note</label>
                <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={labelS}>Recommend Compensation Refund (₦, Optional)</label>
                <input type="number" placeholder="e.g. 5000" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: '8px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedDispute(null)} style={{ background: '#F1F5F9', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
              <button onClick={saveDispute} disabled={savingDispute} style={{ background: '#16A34A', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                {savingDispute ? 'Saving...' : 'Resolve Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {selectedRefund && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>Review Passenger Refund Claim</h2>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Claimant Passenger: <strong style={{ color: '#0F172A' }}>{selectedRefund.user_name}</strong></p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>Refund Amount: <strong style={{ color: '#16A34A' }}>{fmt(selectedRefund.amount)}</strong></p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B' }}>Claim Reason: <span style={{ color: '#475569' }}>"{selectedRefund.reason}"</span></p>
            </div>
            <div>
              <label style={labelS}>Admin Action Notes</label>
              <textarea value={refundAdminNote} onChange={(e) => setRefundAdminNote(e.target.value)} placeholder="Provide context on approval/rejection..." rows={3} style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedRefund(null)} style={{ background: '#F1F5F9', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
              {selectedRefund.status === 'pending' && (
                <>
                  <button id="reject-refund-btn" onClick={() => processRefund('rejected')} disabled={savingRefund} style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Reject</button>
                  <button id="approve-refund-btn" onClick={() => processRefund('completed')} disabled={savingRefund} style={{ background: '#16A34A', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>Approve & Credit Wallet</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '14px 16px' };
const labelS: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const selectS: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', cursor: 'pointer' };
