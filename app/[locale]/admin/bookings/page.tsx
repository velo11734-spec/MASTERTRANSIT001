'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Search, RefreshCw, X, Eye, Ban, DollarSign,
  ChevronDown, CheckCircle, Clock, XCircle, RotateCcw,
  Ticket, Users, Calendar, Hash, CreditCard, AlertCircle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  reference: string;
  user_id: string;
  trip_id: string;
  seat_numbers: string[] | string | null;
  total_price: number;
  status: string;
  created_at: string;
  passenger_name?: string;
  passenger_email?: string;
}

interface ModalState {
  type: 'details' | 'cancel' | 'compensate' | null;
  booking: Booking | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'Confirmed', 'Pending', 'Cancelled', 'Refunded'];

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  confirmed:  { bg: '#DCFCE7', color: '#16A34A' },
  pending:    { bg: '#FEF9C3', color: '#CA8A04' },
  cancelled:  { bg: '#FEE2E2', color: '#DC2626' },
  refunded:   { bg: '#DBEAFE', color: '#2563EB' },
};

const statusStyle = (s: string) =>
  STATUS_COLOR[s?.toLowerCase()] ?? { bg: '#F3F4F6', color: '#6B7280' };

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const seatLabel = (seats: string[] | string | null) => {
  if (!seats) return '—';
  if (Array.isArray(seats)) return seats.join(', ');
  if (typeof seats === 'string') {
    try { return JSON.parse(seats).join(', '); } catch { return seats; }
  }
  return '—';
};

async function logAudit(action: string, targetId: string, meta?: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      action,
      target_type: 'booking',
      target_id: targetId,
      performed_by: user?.id ?? null,
      metadata: meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (_) { /* swallow – non-blocking */ }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [modal, setModal]         = useState<ModalState>({ type: null, booking: null });
  const [compensateAmt, setCompensateAmt] = useState('');
  const [compensateReason, setCompensateReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'All') {
        query = query.eq('status', activeTab.toLowerCase());
      }

      const { data, error } = await query;
      if (error) throw error;

      const raw: Booking[] = data ?? [];

      // Enrich with profile data
      const userIds = [...new Set(raw.map((b) => b.user_id).filter(Boolean))];
      let profileMap: Record<string, { full_name?: string; email?: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        (profiles ?? []).forEach((p: any) => {
          profileMap[p.id] = { full_name: p.full_name, email: p.email };
        });
      }

      const enriched = raw.map((b) => ({
        ...b,
        passenger_name:  profileMap[b.user_id]?.full_name  ?? 'Unknown',
        passenger_email: profileMap[b.user_id]?.email      ?? '—',
      }));

      setBookings(enriched);
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load bookings', false);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Toast ──────────────────────────────────────────────────────────────────

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Search filter ──────────────────────────────────────────────────────────

  const filtered = bookings.filter((b) =>
    !search ||
    b.reference?.toLowerCase().includes(search.toLowerCase()) ||
    b.passenger_name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const cancelBooking = async (booking: Booking) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);
      if (error) throw error;
      await logAudit('cancel_booking', booking.id, { reference: booking.reference });
      showToast(`Booking ${booking.reference} cancelled`, true);
      closeModal();
      fetchBookings();
    } catch (err: any) {
      showToast(err.message ?? 'Cancel failed', false);
    } finally {
      setActionLoading(false);
    }
  };

  const issueCompensation = async () => {
    if (!modal.booking) return;
    const amount = parseFloat(compensateAmt);
    if (isNaN(amount) || amount <= 0) { showToast('Enter a valid amount', false); return; }
    if (!compensateReason.trim()) { showToast('Enter a reason', false); return; }

    setActionLoading(true);
    try {
      await supabase.from('refund_requests').insert({
        booking_id: modal.booking.id,
        user_id: modal.booking.user_id,
        amount,
        reason: compensateReason,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      await logAudit('issue_compensation', modal.booking.id, {
        amount, reason: compensateReason, reference: modal.booking.reference,
      });
      showToast('Compensation issued successfully', true);
      closeModal();
    } catch (err: any) {
      showToast(err.message ?? 'Failed to issue compensation', false);
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (type: ModalState['type'], booking: Booking) => {
    setModal({ type, booking });
    setCompensateAmt('');
    setCompensateReason('');
  };

  const closeModal = () => setModal({ type: null, booking: null });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    pending:   bookings.filter((b) => b.status === 'pending').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px', fontFamily: 'Inter, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#16A34A' : '#DC2626',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontSize: 14, fontWeight: 500,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0 }}>Booking Management</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>Monitor and manage all passenger bookings</p>
        </div>
        <button onClick={fetchBookings} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
          background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8,
          cursor: 'pointer', fontSize: 14, fontWeight: 500,
        }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Bookings', value: stats.total,     icon: <Ticket size={20} />,    bg: '#EFF6FF', c: '#2563EB' },
          { label: 'Confirmed',      value: stats.confirmed, icon: <CheckCircle size={20}/>, bg: '#DCFCE7', c: '#16A34A' },
          { label: 'Pending',        value: stats.pending,   icon: <Clock size={20}/>,       bg: '#FEF9C3', c: '#CA8A04' },
          { label: 'Cancelled',      value: stats.cancelled, icon: <XCircle size={20}/>,     bg: '#FEE2E2', c: '#DC2626' },
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

      {/* Controls */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference or passenger…"
              style={{
                width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none',
                background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  background: activeTab === tab ? '#0F172A' : '#F1F5F9',
                  color: activeTab === tab ? '#fff' : '#64748B',
                  transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 12 }}>Loading bookings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <Ticket size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 15 }}>No bookings found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Reference', 'Passenger', 'Seats', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const ss = statusStyle(b.status);
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{b.reference}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#0F172A' }}>{b.passenger_name}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>{b.passenger_email}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{seatLabel(b.seat_numbers)}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#16A34A' }}>{fmt(b.total_price ?? 0)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: ss.bg, color: ss.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{fmtDate(b.created_at)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ActionBtn icon={<Eye size={14}/>} label="View" color="#2563EB" onClick={() => openModal('details', b)} />
                          {b.status !== 'cancelled' && (
                            <ActionBtn icon={<Ban size={14}/>} label="Cancel" color="#DC2626" onClick={() => openModal('cancel', b)} />
                          )}
                          <ActionBtn icon={<DollarSign size={14}/>} label="Compensate" color="#CA8A04" onClick={() => openModal('compensate', b)} />
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

      {/* ── Modals ── */}

      {/* Details Modal */}
      {modal.type === 'details' && modal.booking && (
        <Modal title="Booking Details" onClose={closeModal}>
          <DetailRow label="Reference"   value={modal.booking.reference} />
          <DetailRow label="Passenger"   value={modal.booking.passenger_name ?? '—'} />
          <DetailRow label="Email"       value={modal.booking.passenger_email ?? '—'} />
          <DetailRow label="Trip ID"     value={modal.booking.trip_id} />
          <DetailRow label="Seats"       value={seatLabel(modal.booking.seat_numbers)} />
          <DetailRow label="Total Price" value={fmt(modal.booking.total_price ?? 0)} />
          <DetailRow label="Status"      value={modal.booking.status} />
          <DetailRow label="Created"     value={fmtDate(modal.booking.created_at)} />
        </Modal>
      )}

      {/* Cancel Confirm Modal */}
      {modal.type === 'cancel' && modal.booking && (
        <Modal title="Cancel Booking" onClose={closeModal}>
          <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
            <AlertCircle size={44} color="#DC2626" style={{ marginBottom: 12 }} />
            <p style={{ color: '#0F172A', fontWeight: 600, fontSize: 16 }}>Are you sure?</p>
            <p style={{ color: '#64748B', fontSize: 14 }}>
              This will cancel booking <strong>{modal.booking.reference}</strong> and cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <ModalBtn label="No, Keep" onClick={closeModal} variant="secondary" />
            <ModalBtn label={actionLoading ? 'Cancelling…' : 'Yes, Cancel'} onClick={() => cancelBooking(modal.booking!)} variant="danger" disabled={actionLoading} />
          </div>
        </Modal>
      )}

      {/* Compensate Modal */}
      {modal.type === 'compensate' && modal.booking && (
        <Modal title="Issue Compensation" onClose={closeModal}>
          <p style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
            Issue a compensation/refund for booking <strong>{modal.booking.reference}</strong>.
          </p>
          <label style={labelStyle}>Amount (NGN)</label>
          <input
            type="number" value={compensateAmt} onChange={(e) => setCompensateAmt(e.target.value)}
            placeholder="e.g. 5000"
            style={inputStyle}
          />
          <label style={{ ...labelStyle, marginTop: 14 }}>Reason</label>
          <textarea
            value={compensateReason} onChange={(e) => setCompensateReason(e.target.value)}
            placeholder="Describe the reason for this compensation…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <ModalBtn label="Cancel" onClick={closeModal} variant="secondary" />
            <ModalBtn label={actionLoading ? 'Issuing…' : 'Issue Compensation'} onClick={issueCompensation} variant="primary" disabled={actionLoading} />
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Small Sub-Components ─────────────────────────────────────────────────────

function ActionBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
        border: `1.5px solid ${color}`, borderRadius: 6, background: 'transparent',
        color, cursor: 'pointer', fontSize: 12, fontWeight: 500,
      }}
    >
      {icon} {label}
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20}/></button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ color: '#64748B', fontSize: 14 }}>{label}</span>
      <span style={{ color: '#0F172A', fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ModalBtn({ label, onClick, variant, disabled }: { label: string; onClick: () => void; variant: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  const bg = variant === 'primary' ? '#16A34A' : variant === 'danger' ? '#DC2626' : '#F1F5F9';
  const color = variant === 'secondary' ? '#0F172A' : '#fff';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: bg, color, fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1 }}
    >
      {label}
    </button>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' };
