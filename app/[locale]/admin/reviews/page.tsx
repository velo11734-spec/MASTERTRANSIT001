'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  RefreshCw, Search, Star, EyeOff, Eye, Trash2, Flag,
  MessageSquare, X, AlertTriangle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  user_id?: string;
  company_id?: string;
  rating?: number;
  content?: string;
  is_hidden?: boolean;
  created_at: string;
  reviewer_name?: string;
  company_name?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Stars = ({ rating }: { rating: number }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={14} fill={n <= rating ? '#F59E0B' : 'none'} color={n <= rating ? '#F59E0B' : '#CBD5E1'} />
    ))}
  </span>
);

async function logAudit(action: string, targetId: string, meta?: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      action, target_type: 'review', target_id: targetId,
      performed_by: user?.id ?? null, metadata: meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [reviews, setReviews]             = useState<Review[]>([]);
  const [loading, setLoading]             = useState(true);
  const [tableExists, setTableExists]     = useState(true);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Review | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') { setTableExists(false); setLoading(false); return; }
        throw error;
      }

      const raw: Review[] = data ?? [];

      // Enrich reviewer names
      const userIds = [...new Set(raw.map((r) => r.user_id).filter(Boolean))];
      const compIds = [...new Set(raw.map((r) => r.company_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      let compMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
        (profiles ?? []).forEach((p: any) => { nameMap[p.id] = p.full_name ?? 'Unknown'; });
      }
      if (compIds.length > 0) {
        const { data: companies } = await supabase.from('companies').select('id, name').in('id', compIds);
        (companies ?? []).forEach((c: any) => { compMap[c.id] = c.name ?? 'Unknown'; });
      }

      setReviews(raw.map((r) => ({
        ...r,
        reviewer_name: nameMap[r.user_id ?? ''] ?? 'Unknown',
        company_name:  compMap[r.company_id ?? ''] ?? '—',
      })));
      setTableExists(true);
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load reviews', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── Filter ──────────────────────────────────────────────────────────────────

  const STATUS_TABS = ['All', 'Visible', 'Hidden'];
  const filtered = reviews.filter((r) => {
    const matchSearch = !search ||
      r.reviewer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.content?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Visible' && !r.is_hidden) ||
      (statusFilter === 'Hidden' && r.is_hidden);
    return matchSearch && matchStatus;
  });

  // ── Actions ─────────────────────────────────────────────────────────────────

  const hideReview = async (r: Review) => {
    setActionLoading(r.id + '_hide');
    try {
      await supabase.from('reviews').update({ is_hidden: true }).eq('id', r.id);
      await logAudit('hide_review', r.id, { reviewer: r.reviewer_name });
      showToast('Review hidden', true);
      fetchReviews();
    } catch (err: any) { showToast(err.message ?? 'Failed', false); }
    finally { setActionLoading(null); }
  };

  const restoreReview = async (r: Review) => {
    setActionLoading(r.id + '_restore');
    try {
      await supabase.from('reviews').update({ is_hidden: false }).eq('id', r.id);
      await logAudit('restore_review', r.id, { reviewer: r.reviewer_name });
      showToast('Review restored', true);
      fetchReviews();
    } catch (err: any) { showToast(err.message ?? 'Failed', false); }
    finally { setActionLoading(null); }
  };

  const deleteReview = async (r: Review) => {
    setActionLoading(r.id + '_delete');
    try {
      await supabase.from('reviews').delete().eq('id', r.id);
      await logAudit('delete_review', r.id, { reviewer: r.reviewer_name });
      showToast('Review deleted', true);
      setDeleteConfirm(null);
      fetchReviews();
    } catch (err: any) { showToast(err.message ?? 'Failed', false); }
    finally { setActionLoading(null); }
  };

  const flagFake = async (r: Review) => {
    setActionLoading(r.id + '_flag');
    try {
      await supabase.from('fraud_flags').insert({
        target_type: 'review', target_id: r.id,
        reason: 'Flagged as fake review by admin',
        created_at: new Date().toISOString(),
      });
      await logAudit('flag_fake_review', r.id, { reviewer: r.reviewer_name });
      showToast('Review flagged as fake', true);
    } catch (err: any) { showToast(err.message ?? 'Flag failed', false); }
    finally { setActionLoading(null); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const avgRating = reviews.length > 0
    ? (reviews.reduce((a, r) => a + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '—';

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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0 }}>Reviews Management</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>Moderate passenger reviews and flag suspicious content</p>
        </div>
        <button onClick={fetchReviews} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <RefreshCw size={15}/> Refresh
        </button>
      </div>

      {/* Stats Row */}
      {tableExists && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Reviews', value: reviews.length,                                         bg: '#EFF6FF', c: '#2563EB', icon: <MessageSquare size={20}/> },
            { label: 'Avg Rating',    value: avgRating,                                              bg: '#FEF9C3', c: '#CA8A04', icon: <Star size={20}/> },
            { label: 'Visible',       value: reviews.filter((r) => !r.is_hidden).length,             bg: '#DCFCE7', c: '#16A34A', icon: <Eye size={20}/> },
            { label: 'Hidden',        value: reviews.filter((r) => r.is_hidden).length,              bg: '#F3F4F6', c: '#6B7280', icon: <EyeOff size={20}/> },
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
      )}

      {/* Table Card */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {!tableExists ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
            <MessageSquare size={40} style={{ opacity: 0.4, marginBottom: 12 }}/>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#64748B' }}>Reviews table not found</p>
            <p style={{ fontSize: 13 }}>Create a <code>reviews</code> table in Supabase to use this feature.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}/>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviewer, company, content…"
                  style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}/>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUS_TABS.map((tab) => (
                  <button key={tab} onClick={() => setStatusFilter(tab)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: statusFilter === tab ? '#0F172A' : '#F1F5F9', color: statusFilter === tab ? '#fff' : '#64748B', transition: 'all 0.15s' }}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
                <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }}/>
                <p style={{ marginTop: 12 }}>Loading reviews…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
                <Star size={40} style={{ opacity: 0.4, marginBottom: 12 }}/>
                <p>No reviews found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Reviewer', 'Company', 'Rating', 'Review', 'Status', 'Date', 'Actions'].map((h) => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA', opacity: r.is_hidden ? 0.6 : 1 }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{r.reviewer_name}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{r.company_name}</td>
                        <td style={{ padding: '14px 16px' }}><Stars rating={r.rating ?? 0}/></td>
                        <td style={{ padding: '14px 16px', color: '#475569', maxWidth: 260 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.content ?? '—'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            background: r.is_hidden ? '#F3F4F6' : '#DCFCE7',
                            color: r.is_hidden ? '#6B7280' : '#16A34A',
                            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          }}>
                            {r.is_hidden ? 'Hidden' : 'Visible'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {r.is_hidden ? (
                              <ABtn icon={<Eye size={13}/>} label="Restore" color="#16A34A" loading={actionLoading === r.id + '_restore'} onClick={() => restoreReview(r)}/>
                            ) : (
                              <ABtn icon={<EyeOff size={13}/>} label="Hide" color="#CA8A04" loading={actionLoading === r.id + '_hide'} onClick={() => hideReview(r)}/>
                            )}
                            <ABtn icon={<Flag size={13}/>} label="Fake" color="#DC2626" loading={actionLoading === r.id + '_flag'} onClick={() => flagFake(r)}/>
                            <ABtn icon={<Trash2 size={13}/>} label="Delete" color="#DC2626" loading={actionLoading === r.id + '_delete'} onClick={() => setDeleteConfirm(r)}/>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <AlertTriangle size={48} color="#DC2626" style={{ marginBottom: 16 }}/>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Delete Review?</h2>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>
              This will permanently delete <strong>{deleteConfirm.reviewer_name}</strong>'s review. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#0F172A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deleteReview(deleteConfirm)} disabled={!!actionLoading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {actionLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ABtn({ icon, label, color, onClick, loading }: { icon: React.ReactNode; label: string; color: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} title={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', border: `1.5px solid ${color}`, borderRadius: 6, background: 'transparent', color, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500, opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap' }}>
      {loading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }}/> : icon} {label}
    </button>
  );
}
