'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  RefreshCw, Search, X, AlertCircle, CheckCircle,
  Clock, Shield, ChevronDown, DollarSign, User,
  FileText, MessageSquare,
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
  assigned_to?: string;
  resolution_notes?: string;
  evidence?: string[] | null;
  complainant_name?: string;
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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n ?? 0);

async function logAudit(action: string, targetId: string, meta?: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      action, target_type: 'dispute', target_id: targetId,
      performed_by: user?.id ?? null, metadata: meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DisputesPage() {
  const [disputes, setDisputes]       = useState<Dispute[]>([]);
  const [admins, setAdmins]           = useState<AdminUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected]       = useState<Dispute | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  // Modal fields
  const [newStatus, setNewStatus]         = useState('');
  const [resolution, setResolution]       = useState('');
  const [assignedTo, setAssignedTo]       = useState('');
  const [refundAmount, setRefundAmount]   = useState('');
  const [saving, setSaving]               = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const raw: Dispute[] = data ?? [];

      // Enrich complainant names
      const ids = [...new Set(raw.map((d) => d.complainant_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? 'Unknown'; });
      }

      setDisputes(raw.map((d) => ({ ...d, complainant_name: nameMap[d.complainant_id ?? ''] ?? 'Unknown' })));
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load disputes', false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'admin');
      setAdmins(data ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchDisputes(); fetchAdmins(); }, [fetchDisputes, fetchAdmins]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const counts = {
    open:          disputes.filter((d) => d.status === 'open').length,
    investigating: disputes.filter((d) => d.status === 'investigating').length,
    resolved:      disputes.filter((d) => d.status === 'resolved').length,
    escalated:     disputes.filter((d) => d.status === 'escalated').length,
  };

  // ── Filter ──────────────────────────────────────────────────────────────────

  const STATUS_TABS = ['All', 'Open', 'Investigating', 'Resolved', 'Escalated', 'Closed'];
  const filtered = disputes.filter((d) => {
    const matchSearch = !search ||
      d.reference?.toLowerCase().includes(search.toLowerCase()) ||
      d.subject?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || d.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // ── Open Modal ─────────────────────────────────────────────────────────────

  const openDetail = (d: Dispute) => {
    setSelected(d);
    setNewStatus(d.status);
    setResolution(d.resolution_notes ?? '');
    setAssignedTo(d.assigned_to ?? '');
    setRefundAmount('');
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const saveDispute = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updates: Partial<Dispute> = {
        status: newStatus,
        resolution_notes: resolution,
        assigned_to: assignedTo || undefined,
      };
      const { error } = await supabase.from('disputes').update(updates).eq('id', selected.id);
      if (error) throw error;

      // Issue refund if amount provided
      if (refundAmount && parseFloat(refundAmount) > 0) {
        await supabase.from('refund_requests').insert({
          dispute_id: selected.id,
          user_id: selected.complainant_id,
          amount: parseFloat(refundAmount),
          reason: `Dispute resolution: ${selected.reference ?? selected.id}`,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }

      await logAudit('update_dispute', selected.id, {
        reference: selected.reference, old_status: selected.status, new_status: newStatus, assigned_to: assignedTo,
      });

      showToast('Dispute updated successfully', true);
      setSelected(null);
      fetchDisputes();
    } catch (err: any) {
      showToast(err.message ?? 'Save failed', false);
    } finally {
      setSaving(false);
    }
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0 }}>Dispute Resolution Center</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>Manage and resolve passenger and company disputes</p>
        </div>
        <button onClick={fetchDisputes} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <RefreshCw size={15}/> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Open',          value: counts.open,          icon: <AlertCircle size={20}/>, bg: '#DBEAFE', c: '#2563EB' },
          { label: 'Investigating', value: counts.investigating, icon: <Clock size={20}/>,       bg: '#FEF9C3', c: '#CA8A04' },
          { label: 'Resolved',      value: counts.resolved,      icon: <CheckCircle size={20}/>, bg: '#DCFCE7', c: '#16A34A' },
          { label: 'Escalated',     value: counts.escalated,     icon: <Shield size={20}/>,      bg: '#FEE2E2', c: '#DC2626' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0 }}>{s.value}</p>
              </div>
              <div style={{ background: s.bg, color: s.c, borderRadius: 10, padding: 10 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference or subject…"
              style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}/>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => (
              <button key={tab} onClick={() => setStatusFilter(tab)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: statusFilter === tab ? '#0F172A' : '#F1F5F9', color: statusFilter === tab ? '#fff' : '#64748B', transition: 'all 0.15s' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }}/>
            <p style={{ marginTop: 12 }}>Loading disputes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <Shield size={40} style={{ opacity: 0.4, marginBottom: 12 }}/>
            <p>No disputes found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Case Ref', 'Subject', 'Complainant', 'Priority', 'Status', 'Date', 'Assigned To', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const ps = PRIORITY_STYLE[d.priority?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
                  const st = STATUS_STYLE[d.status?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }} onClick={() => openDetail(d)}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{d.reference ?? d.id.slice(0, 8)}</td>
                      <td style={{ padding: '14px 16px', color: '#0F172A', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.subject ?? '—'}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{d.complainant_name}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: ps.bg, color: ps.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{d.priority ?? '—'}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{d.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{fmtDate(d.created_at)}</td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{d.assigned_to ?? '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={(e) => { e.stopPropagation(); openDetail(d); }} style={{ padding: '6px 12px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Dispute: {selected.reference ?? selected.id.slice(0, 8)}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20}/></button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <InfoChip icon={<User size={14}/>} label="Complainant" value={selected.complainant_name ?? '—'}/>
                <InfoChip icon={<Clock size={14}/>} label="Filed On" value={fmtDate(selected.created_at)}/>
                <InfoChip icon={<AlertCircle size={14}/>} label="Priority" value={selected.priority ?? '—'}/>
                <InfoChip icon={<Shield size={14}/>} label="Current Status" value={selected.status}/>
              </div>

              {/* Subject */}
              {selected.subject && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelS}>Subject</label>
                  <p style={{ margin: 0, color: '#0F172A', fontSize: 14, fontWeight: 500 }}>{selected.subject}</p>
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelS}>Description</label>
                  <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6, background: '#F8FAFC', padding: 12, borderRadius: 8 }}>{selected.description}</p>
                </div>
              )}

              {/* Evidence */}
              {selected.evidence && selected.evidence.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelS}>Evidence Files ({selected.evidence.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selected.evidence.map((e, idx) => (
                      <a key={idx} href={e} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: '#EFF6FF', color: '#2563EB', borderRadius: 6, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={13}/> File {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '20px 0' }}/>

              {/* Status Update */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelS}>Update Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={selectS}>
                  {['open', 'investigating', 'resolved', 'closed', 'escalated'].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Assign To */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelS}>Assign To</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={selectS}>
                  <option value="">— Unassigned —</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.full_name ?? a.email}</option>)}
                </select>
              </div>

              {/* Resolution Notes */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelS}>Resolution Notes</label>
                <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={4} placeholder="Enter resolution details…"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', resize: 'vertical', boxSizing: 'border-box' }}/>
              </div>

              {/* Refund Amount */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelS}>Issue Refund Amount (NGN, optional)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}/>
                  <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="0.00"
                    style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}/>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#0F172A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveDispute} disabled={saving} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, marginBottom: 4 }}>{icon}{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}

const labelS: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const selectS: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', cursor: 'pointer' };
