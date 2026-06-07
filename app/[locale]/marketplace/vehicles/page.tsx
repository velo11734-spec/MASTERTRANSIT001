'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, Filter, Search, Plus, Check, CreditCard, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

export default function VehicleMarketplacePage() {
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('All');
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  
  // Settings fetched from DB
  const [listingFee, setListingFee] = useState(5000);
  const [featuredFee, setFeaturedFee] = useState(20000);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // List Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'Bus',
    model: '',
    price: '',
    capacity: '14',
    isFeatured: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { data } = await supabase.from('platform_settings').select('key, value').in('key', ['vehicle_listing_fee', 'vehicle_featured_fee']);
      if (data) {
        const lf = data.find(d => d.key === 'vehicle_listing_fee');
        const ff = data.find(d => d.key === 'vehicle_featured_fee');
        if (lf) setListingFee(Number(lf.value) || 5000);
        if (ff) setFeaturedFee(Number(ff.value) || 20000);
      }
    } catch (_) {} finally {
      setLoadingSettings(false);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select(`*, companies(name)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setListings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchListings();
  }, [fetchSettings, fetchListings]);

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const amountToPay = listingFee + (form.isFeatured ? featuredFee : 0);

      // Simulating marketplace payment trigger
      // Record transaction
      const vehicleId = `VEH-${Date.now()}`;
      
      if (user) {
        // Fetch user's company id to list under it
        const { data: companyData } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle();
        const companyId = companyData?.id;

        if (!companyId) {
           throw new Error("Must own a company to list a vehicle.");
        }

        // Insert listing
        const { data: newListing, error: listingError } = await supabase.from('vehicle_listings').insert({
          company_id: companyId,
          title: form.title,
          vehicle_type: form.type,
          model: form.model,
          make: 'Various',
          year: new Date().getFullYear(),
          price: Number(form.price),
          capacity: Number(form.capacity),
          status: 'active'
        }).select().single();

        if (listingError) throw listingError;

        // Log to platform treasury
        await supabase.from('platform_treasury').insert({
          transaction_type: form.isFeatured ? 'featured_fee' : 'listing_fee',
          amount: amountToPay,
          source_id: newListing.id,
          source_type: 'vehicle_listing',
          description: `Vehicle Sale Listing: ${form.title} (${form.model})`,
        });
        
        fetchListings();
      }

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setForm({
          title: '',
          type: 'Bus',
          model: '',
          price: '',
          capacity: '14',
          isFeatured: false,
        });
      }, 2500);

    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCost = listingFee + (form.isFeatured ? featuredFee : 0);

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Back Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/en/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Mobility Marketplace
          </Link>
          <button id="list-vehicle-btn" onClick={() => setShowModal(true)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Sell a Vehicle
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Vehicle Marketplace</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Buy or sell buses, luxury coaches, airport shuttles, and commercial minivans</p>
        </div>

        {/* Search and Filter panel */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by brand, type, or model..."
              style={{
                width: '100%',
                paddingLeft: 38,
                paddingRight: 12,
                paddingTop: 10,
                paddingBottom: 10,
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                fontSize: 13,
                boxSizing: 'border-box',
                outline: 'none',
                background: '#fff'
              }}
            />
          </div>
          <select
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
            style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '0 12px', fontSize: 13, color: '#374151', cursor: 'pointer', background: '#fff' }}
          >
            <option value="All">All Types</option>
            <option value="Bus">Luxury Coach</option>
            <option value="Mini">Minivan</option>
            <option value="Shuttle">Airport Shuttle</option>
          </select>
        </div>

        {/* Listings Data */}
        {loadingListings ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Loading listings...</div>
        ) : listings.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 64, height: 64, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Car size={32} color="#16A34A" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8, margin: 0 }}>No vehicles currently listed for sale</h3>
            <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '12px auto 20px', lineHeight: 1.5 }}>
              We are onboarding verified dealers and transportation fleets. Check back shortly to view premium commercial listings.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowModal(true)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Post a Listing ({fmt(listingFee)})</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
            {listings.filter(l => (vehicleType === 'All' || l.vehicle_type === vehicleType) && l.title.toLowerCase().includes(search.toLowerCase())).map(l => (
              <div key={l.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ height: 160, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={40} color="#94A3B8" />
                </div>
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{l.title}</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px' }}>{l.companies?.name || 'Verified Dealer'}</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, color: '#475569' }}>{l.vehicle_type}</span>
                    <span style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, color: '#475569' }}>{l.capacity} Seats</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>
                    {fmt(l.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Sell Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', width: '450px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            
            {success ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ width: 56, height: 56, background: '#DCFCE7', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Check size={28} /></div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Payment Successful!</h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Your vehicle listing has been published to the marketplace.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Car size={20} color="#16A34A" /> List a Vehicle for Sale</h2>
                <form onSubmit={handleSubmitListing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Listing Title</label>
                    <input required type="text" placeholder="e.g. Brand New Toyota Hiace Bus 2024" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} style={inputS} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Vehicle Type</label>
                      <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} style={selectS}>
                        <option value="Bus">Luxury Coach</option>
                        <option value="Mini">Minivan</option>
                        <option value="Shuttle">Airport Shuttle</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Model / Year</label>
                      <input required type="text" placeholder="e.g. Toyota Hiace" value={form.model} onChange={e => setForm(prev => ({ ...prev, model: e.target.value }))} style={inputS} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Sale Price (₦)</label>
                      <input required type="number" placeholder="e.g. 45000000" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))} style={inputS} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Seating Capacity</label>
                      <input required type="number" placeholder="e.g. 14" value={form.capacity} onChange={e => setForm(prev => ({ ...prev, capacity: e.target.value }))} style={inputS} />
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={e => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))} style={{ marginTop: '3px' }} />
                      <label htmlFor="isFeatured" style={{ fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}><Sparkles size={14} color="#8B5CF6" /> Feature this Listing (+{fmt(featuredFee)})</span>
                        <span style={{ display: 'block', color: '#64748B', fontSize: '11px', marginTop: '2px' }}>Place your vehicle listing at the very top of search results.</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Total Cost:</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{fmt(totalCost)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button id="cancel-listing-btn" type="button" onClick={() => setShowModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                      <button id="submit-listing-btn" type="submit" disabled={submitting} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={14} />}
                        Pay & Publish
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const inputS = { width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' as const };
const selectS = { width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#F8FAFC', color: '#0F172A', cursor: 'pointer' };
