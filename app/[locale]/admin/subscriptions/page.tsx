'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CreditCard, RefreshCw, Sparkles, AlertTriangle, Shield, Check, Edit2, X } from 'lucide-react';

interface SubPlan {
  id: string;
  name: 'Basic' | 'Professional' | 'Enterprise';
  price_monthly: number;
  price_annual: number;
  features: string[];
  max_routes: number;
  max_fleet: number;
  is_active: boolean;
}

interface ActiveSub {
  id: string;
  company_id: string;
  company_name?: string;
  plan_name?: string;
  billing_cycle: 'monthly' | 'annual';
  status: string;
  started_at: string;
  expires_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [activeSubs, setActiveSubs] = useState<ActiveSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  
  // Editing prices state
  const [editPricePlanId, setEditPricePlanId] = useState<string | null>(null);
  const [editMonthly, setEditMonthly] = useState<string>('');
  const [editAnnual, setEditAnnual] = useState<string>('');

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch plans
      const { data: plData, error: plErr } = await supabase.from('subscription_plans').select('*').order('price_monthly');
      if (plErr) throw plErr;
      setPlans(plData ?? []);

      // 2. Fetch active company subscriptions
      const { data: coSubs, error: subErr } = await supabase
        .from('company_subscriptions')
        .select(`
          id, company_id, billing_cycle, status, started_at, expires_at,
          companies:company_id (name),
          subscription_plans:plan_id (name)
        `);
      if (subErr) throw subErr;

      const formattedSubs = (coSubs ?? []).map((s: any) => ({
        id: s.id,
        company_id: s.company_id,
        company_name: s.companies?.name ?? '—',
        plan_name: s.subscription_plans?.name ?? '—',
        billing_cycle: s.billing_cycle,
        status: s.status,
        started_at: s.started_at,
        expires_at: s.expires_at,
      }));
      setActiveSubs(formattedSubs);

    } catch (err: any) {
      showToast(err.message || 'Error loading subscriptions info', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const savePrices = async (plan: SubPlan) => {
    const monthlyVal = Number(editMonthly);
    const annualVal = Number(editAnnual);
    if (isNaN(monthlyVal) || isNaN(annualVal)) {
      showToast('Please enter valid price numbers', false);
      return;
    }

    try {
      // 1. Update plans table
      await supabase.from('subscription_plans').update({
        price_monthly: monthlyVal,
        price_annual: annualVal,
      }).eq('id', plan.id);

      // 2. Sync to platform_settings for configurability
      const keyPrefix = `subscription_${plan.name.toLowerCase()}`;
      await supabase.from('platform_settings').upsert({
        key: `${keyPrefix}_price`,
        value: String(monthlyVal),
      }, { onConflict: 'key' });

      // Audit Log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        actor_email: user?.email,
        action: 'SUBSCRIPTION_PLAN_PRICE_UPDATED',
        entity_type: 'subscription_plan',
        entity_id: plan.id,
        new_value: { monthly: monthlyVal, annual: annualVal },
      });

      setEditPricePlanId(null);
      showToast(`${plan.name} pricing updated successfully`);
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Save prices failed', false);
    }
  };

  const cancelActiveSub = async (sub: ActiveSub) => {
    if (!confirm(`Are you sure you want to cancel the subscription for ${sub.company_name}?`)) return;
    try {
      await supabase.from('company_subscriptions').update({ status: 'cancelled' }).eq('id', sub.id);
      
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        actor_email: user?.email,
        action: 'COMPANY_SUBSCRIPTION_CANCELLED',
        entity_type: 'company_subscription',
        entity_id: sub.id,
        new_value: { status: 'cancelled' },
      });

      showToast(`Cancelled subscription for ${sub.company_name}`);
      fetchAll();
    } catch (err: any) {
      showToast(err.message || 'Cancellation failed', false);
    }
  };

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
            <CreditCard size={26} color="#16A34A" /> B2B Partner Subscriptions
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Configure SaaS plans and manage partner memberships</p>
        </div>
        <button id="refresh-subs-btn" onClick={fetchAll} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', color: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px' }}>Loading subscription records...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Plan Configuration Cards */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Subscription Tiers</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {plans.map((p) => {
                const isEditing = editPricePlanId === p.id;
                return (
                  <div key={p.id} style={{ background: '#1E293B', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#E2E8F0' }}>{p.name}</span>
                        <Sparkles size={16} color={p.name === 'Enterprise' ? '#8B5CF6' : p.name === 'Professional' ? '#16A34A' : '#94A3B8'} />
                      </div>
                      
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '14px 0' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Monthly Price (₦)</label>
                            <input type="number" value={editMonthly} onChange={e => setEditMonthly(e.target.value)} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Annual Price (₦)</label>
                            <input type="number" value={editAnnual} onChange={e => setEditAnnual(e.target.value)} style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', color: '#F8FAFC', width: '100%', fontSize: '13px' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button id={`save-plan-prices-${p.id}`} onClick={() => savePrices(p)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flex: 1 }}>Save</button>
                            <button id={`cancel-plan-prices-${p.id}`} onClick={() => setEditPricePlanId(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}><X size={12} /></button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ margin: '14px 0' }}>
                          <span style={{ fontSize: '26px', fontWeight: 800, color: '#16A34A' }}>{fmt(p.price_monthly)}</span>
                          <span style={{ fontSize: '12px', color: '#64748B' }}> / month</span>
                          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Annual rate: {fmt(p.price_annual)} / yr</div>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px', marginTop: '14px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748B', fontWeight: 600 }}>GATES & GUARES</p>
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <li>Max Routes: {p.max_routes === 999999 ? 'Unlimited' : p.max_routes}</li>
                          <li>Max Fleet Size: {p.max_fleet === 999999 ? 'Unlimited' : p.max_fleet}</li>
                          {Array.isArray(p.features) && p.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {!isEditing && (
                      <button id={`edit-plan-btn-${p.id}`} onClick={() => { setEditPricePlanId(p.id); setEditMonthly(String(p.price_monthly)); setEditAnnual(String(p.price_annual)); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', width: '100%', color: '#F8FAFC', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Edit2 size={12} /> Edit Tier Pricing
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Members Table */}
          <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0', margin: '0 0 16px' }}>Company Subscriptions Ledger</h2>
            {activeSubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                <AlertTriangle size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>No active transport company subscriptions recorded.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#64748B' }}>
                      <th style={{ padding: '12px 8px' }}>Transport Partner</th>
                      <th style={{ padding: '12px 8px' }}>Active Plan</th>
                      <th style={{ padding: '12px 8px' }}>Billing Cycle</th>
                      <th style={{ padding: '12px 8px' }}>Expires On</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSubs.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{sub.company_name}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ color: sub.plan_name === 'Enterprise' ? '#8B5CF6' : sub.plan_name === 'Professional' ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                            {sub.plan_name}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: '#94A3B8' }}>{sub.billing_cycle}</td>
                        <td style={{ padding: '12px 8px', color: '#64748B' }}>{fmtDate(sub.expires_at)}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ background: sub.status === 'active' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: sub.status === 'active' ? '#22C55E' : '#EF4444', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          {sub.status === 'active' && (
                            <button id={`cancel-sub-${sub.id}`} onClick={() => cancelActiveSub(sub)} style={{ background: 'transparent', border: '1px solid #DC2626', color: '#EF4444', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                              Cancel Plan
                            </button>
                          )}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
