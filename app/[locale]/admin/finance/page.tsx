'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
  RefreshCw, CreditCard, ShoppingBag, Car, Megaphone, CheckCircle, Clock
} from 'lucide-react';

interface TreasuryTx {
  id: string;
  transaction_type: 'commission' | 'listing_fee' | 'featured_fee' | 'rental_commission' | 'ad_slot' | 'subscription';
  amount: number;
  source_id: string | null;
  source_type: string | null;
  description: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, any> = {
  commission:        TrendingUp,
  listing_fee:       ShoppingBag,
  featured_fee:      ShoppingBag,
  rental_commission: Car,
  ad_slot:           Megaphone,
  subscription:      CreditCard,
};

const TYPE_COLOR: Record<string, string> = {
  commission:        '#16A34A', // Green
  listing_fee:       '#3B82F6', // Blue
  featured_fee:      '#8B5CF6', // Purple
  rental_commission: '#06B6D4', // Cyan
  ad_slot:           '#EC4899', // Pink
  subscription:      '#F59E0B', // Amber
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminFinancePage() {
  const [txs, setTxs] = useState<TreasuryTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    commission: 0,
    listings: 0,
    rentals: 0,
    subscriptions: 0,
    ads: 0,
  });

  const fetchTreasury = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_treasury')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list: TreasuryTx[] = data ?? [];
      setTxs(list);

      // Compute statistics
      let total = 0;
      let commission = 0;
      let listings = 0;
      let rentals = 0;
      let subscriptions = 0;
      let ads = 0;

      list.forEach((t) => {
        const amt = Number(t.amount) || 0;
        total += amt;
        if (t.transaction_type === 'commission') {
          commission += amt;
        } else if (t.transaction_type === 'listing_fee' || t.transaction_type === 'featured_fee') {
          listings += amt;
        } else if (t.transaction_type === 'rental_commission') {
          rentals += amt;
        } else if (t.transaction_type === 'subscription') {
          subscriptions += amt;
        } else if (t.transaction_type === 'ad_slot') {
          ads += amt;
        }
      });

      setStats({ total, commission, listings, rentals, subscriptions, ads });
    } catch (_) {
      // Graceful fallback if tables not ready or query fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreasury();
  }, [fetchTreasury]);

  const maxStat = Math.max(
    stats.commission,
    stats.listings,
    stats.rentals,
    stats.subscriptions,
    stats.ads,
    1
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={26} color="#16A34A" /> RoutePro Treasury
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Platform revenue monitoring & financial ledger</p>
        </div>
        <button id="refresh-treasury-btn" onClick={fetchTreasury} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', color: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px' }}>Loading financial intelligence...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main treasury overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', border: '1px solid rgba(22,163,74,0.2)', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Platform Revenue</span>
                <span style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>Active</span>
              </div>
              <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '12px 0 6px', color: '#16A34A' }}>{fmt(stats.total)}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Cumulative platform earnings across all modules</p>
            </div>

            <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Ticket Commissions</span>
              <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '12px 0 6px', color: '#F8FAFC' }}>{fmt(stats.commission)}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>10% cut on standard travel bookings</p>
            </div>

            <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Subscriptions & Ads</span>
              <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '12px 0 6px', color: '#F8FAFC' }}>{fmt(stats.subscriptions + stats.ads)}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Company monthly fees & advertising slots</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
            {/* Breakdown */}
            <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px', color: '#E2E8F0' }}>Revenue Stream Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <BreakdownRow label="Booking Commission" amount={stats.commission} color={TYPE_COLOR.commission} max={maxStat} />
                <BreakdownRow label="Marketplace Listings" amount={stats.listings} color={TYPE_COLOR.listing_fee} max={maxStat} />
                <BreakdownRow label="Rental Commission" amount={stats.rentals} color={TYPE_COLOR.rental_commission} max={maxStat} />
                <BreakdownRow label="Subscriptions" amount={stats.subscriptions} color={TYPE_COLOR.subscription} max={maxStat} />
                <BreakdownRow label="Advertising Revenues" amount={stats.ads} color={TYPE_COLOR.ad_slot} max={maxStat} />
              </div>
            </div>

            {/* Recent Ledger */}
            <div style={{ background: '#1E293B', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#E2E8F0' }}>Treasury Ledger History</h3>
              {txs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                  <Clock size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', margin: 0 }}>No transactions in platform treasury ledger yet.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#64748B' }}>
                        <th style={{ padding: '10px 8px' }}>Source</th>
                        <th style={{ padding: '10px 8px' }}>Description</th>
                        <th style={{ padding: '10px 8px' }}>Date</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.slice(0, 10).map((t) => {
                        const Icon = TYPE_ICON[t.transaction_type] || DollarSign;
                        const col = TYPE_COLOR[t.transaction_type] || '#F8FAFC';
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ background: `${col}15`, color: col, width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon size={14} />
                                </div>
                                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{t.transaction_type.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', color: '#94A3B8' }}>{t.description ?? '—'}</td>
                            <td style={{ padding: '12px 8px', color: '#64748B' }}>{fmtDate(t.created_at)}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>+{fmt(t.amount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

function BreakdownRow({ label, amount, color, max }: { label: string; amount: number; color: string; max: number }) {
  const pct = Math.max(Math.min((amount / max) * 100, 100), 2);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
        <span style={{ color: '#94A3B8', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{fmt(amount)}</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
      </div>
    </div>
  );
}
