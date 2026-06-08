'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Megaphone, RefreshCw, Plus, Trash2, Shield, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface AdSlot {
  id: string;
  slot_type: 'homepage_banner' | 'search_top' | 'featured_route' | 'sidebar';
  title: string;
  company_id: string | null;
  company_name?: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  status: 'active' | 'expired' | 'scheduled';
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminAdvertisingPage() {
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    slot_type: 'homepage_banner',
    title: '',
    company_id: '',
    start_date: '',
    end_date: '',
    amount_paid: '',
  });

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch companies for select dropdown
      const { data: coData } = await supabase.from('companies').select('id, name').order('name');
      setCompanies(coData ?? []);

      // 2. Fetch ad slots
      const { data: adData, error: adErr } = await supabase.from('ad_slots').select('*').order('created_at', { ascending: false });
      if (adErr) throw adErr;

      const coMap: Record<string, string> = {};
      (coData ?? []).forEach((c) => { coMap[c.id] = c.name; });

      const formattedAds = (adData ?? []).map((ad: any) => ({
        ...ad,
        company_name: ad.company_id ? coMap[ad.company_id] ?? '—' : 'Self/External',
      }));
      setAds(formattedAds);

    } catch (err: any) {
      showToast(err.message || 'Error loading advertising information', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount_paid);
    if (!form.title || isNaN(amount) || amount <= 0 || !form.start_date || !form.end_date) {
      showToast('Please fill all required fields with valid data', false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newAd = {
        slot_type: form.slot_type,
        title: form.title,
        company_id: form.company_id || null,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        amount_paid: amount,
        status: new Date(form.start_date) <= new Date() ? 'active' : 'scheduled',
        created_by: user?.id || null,
      };

      const { data, error } = await supabase.from('ad_slots').insert(newAd).select();
      if (error) throw error;

      // Log to platform_treasury
      await supabase.from('platform_treasury').insert({
        transaction_type: 'ad_slot',
        amount: amount,
        source_id: data?.[0]?.id || '',
        source_type: 'ad_slot',
        description: `Ad Slot Revenue: ${form.title} (${form.slot_type.replace('_', ' ')})`,
      });

      // Audit Log
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        actor_email: user?.email,
        action: 'AD_SLOT_CREATED',
        entity_type: 'ad_slot',
        entity_id: data?.[0]?.id,
        new_value: newAd,
      });

      showToast('Ad slot allocated and treasury logged');
      setShowAddModal(false);
      setForm({
        slot_type: 'homepage_banner',
        title: '',
        company_id: '',
        start_date: '',
        end_date: '',
        amount_paid: '',
      });
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Error creating ad slot', false);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad slot?')) return;
    try {
      const { error } = await supabase.from('ad_slots').delete().eq('id', id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        actor_email: user?.email,
        action: 'AD_SLOT_DELETED',
        entity_type: 'ad_slot',
        entity_id: id,
      });

      showToast('Ad slot deleted successfully');
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Error deleting ad slot', false);
    }
  };

  const totalAdRevenue = ads.reduce((sum, ad) => sum + (Number(ad.amount_paid) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Megaphone size={26} color="#16A34A" /> Ad Slots & Sponsored Placements
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Monitor sponsored visibility slots and record direct campaign sales</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button id="add-ad-btn" onClick={() => setShowAddModal(true)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Plus size={16} /> Allocate Ad Slot
          </button>
          <button id="refresh-ads-btn" onClick={fetchAll} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', color: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px' }}>Loading sponsored placements...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Ad Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Sponsored Placements Revenue</span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '12px 0 6px', color: '#16A34A' }}>{fmt(totalAdRevenue)}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>All-time total fees logged from sponsored slots</p>
            </div>
            <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Active Ads</span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '12px 0 6px', color: '#F8FAFC' }}>{ads.filter(ad => ad.status === 'active').length}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Currently serving visibility placements</p>
            </div>
          </div>

          {/* Active Campaigns Table */}
          <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 16px' }}>Visibility Slots Directory</h2>
            {ads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                <AlertTriangle size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>No sponsored visibility slots configured.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '12px 8px' }}>Placement Slot</th>
                      <th style={{ padding: '12px 8px' }}>Campaign Title</th>
                      <th style={{ padding: '12px 8px' }}>Sponsor Partner</th>
                      <th style={{ padding: '12px 8px' }}>Duration</th>
                      <th style={{ padding: '12px 8px' }}>Price Paid</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => (
                      <tr key={ad.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, textTransform: 'capitalize' }}>{ad.slot_type.replace('_', ' ')}</td>
                        <td style={{ padding: '12px 8px', color: '#E2E8F0' }}>{ad.title}</td>
                        <td style={{ padding: '12px 8px', color: '#94A3B8' }}>{ad.company_name}</td>
                        <td style={{ padding: '12px 8px', color: '#64748B' }}>{fmtDate(ad.start_date)} - {fmtDate(ad.end_date)}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#16A34A' }}>{fmt(ad.amount_paid)}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            background: ad.status === 'active' ? 'rgba(22,163,74,0.1)' : ad.status === 'scheduled' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                            color: ad.status === 'active' ? '#22C55E' : ad.status === 'scheduled' ? '#3B82F6' : '#64748B',
                            padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700
                          }}>{ad.status}</span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button id={`delete-ad-${ad.id}`} onClick={() => deleteAd(ad.id)} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Allocation Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px', width: '450px', maxWidth: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}><Megaphone size={18} color="#16A34A" /> Allocate Visibility Slot</h2>
            <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Visibility Placement Type</label>
                <select value={form.slot_type} onChange={e => setForm(prev => ({ ...prev, slot_type: e.target.value }))} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }}>
                  <option value="homepage_banner">Homepage Banner placement (₦50,000/mo)</option>
                  <option value="search_top">Top of Search result placement (₦25,000/mo)</option>
                  <option value="featured_route">Featured Transport Route placement (₦25,000/mo)</option>
                  <option value="sidebar">Sidebar Widget placement (₦15,000/mo)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Campaign Title / Placement Name</label>
                <input required type="text" placeholder="e.g. ABC Transport Summer Travel Ads" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Sponsor Partner (Optional)</label>
                <select value={form.company_id} onChange={e => setForm(prev => ({ ...prev, company_id: e.target.value }))} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }}>
                  <option value="">None / External Advertiser</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Start Date</label>
                  <input required type="date" value={form.start_date} onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>End Date</label>
                  <input required type="date" value={form.end_date} onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Listing Fee Paid (₦)</label>
                <input required type="number" placeholder="e.g. 50000" value={form.amount_paid} onChange={e => setForm(prev => ({ ...prev, amount_paid: e.target.value }))} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button id="cancel-ad-modal" type="button" onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                <button id="submit-ad-modal" type="submit" style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', flex: 1 }}>Allocate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
