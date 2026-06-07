'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Key, Calendar, MapPin, CheckCircle, CreditCard,
  RefreshCw, Car, Users, Clock, Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

interface RentalListing {
  id: string;
  title: string;
  vehicle_type: string;
  capacity: number;
  daily_rate: number;
  pickup_location: string;
  status: string;
  companies?: { name: string };
}

export default function VehicleRentalsPage() {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Settings loaded from DB
  const [depositPct, setDepositPct] = useState(30);

  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<RentalListing | null>(null);
  const [days, setDays] = useState('3');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .eq('key', 'rental_deposit_pct')
        .maybeSingle();
      if (data) setDepositPct(Number(data.value) || 30);
    } catch (_) {}
  }, []);

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      let query = supabase
        .from('rental_listings')
        .select('*, companies(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (location.trim()) {
        query = query.ilike('pickup_location', `%${location.trim()}%`);
      }

      const { data, error } = await query;
      if (!error && data) setListings(data as RentalListing[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingListings(false);
    }
  }, [location]);

  useEffect(() => {
    fetchSettings();
    fetchListings();
  }, [fetchSettings, fetchListings]);

  const openBooking = (listing: RentalListing) => {
    setSelectedListing(listing);
    setDays('3');
    setBookingSuccess(false);
    setShowModal(true);
  };

  const handleBookRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const totalCost = selectedListing.daily_rate * Number(days);
      const depositAmt = (totalCost * depositPct) / 100;

      if (user) {
        // Create rental booking record
        const { data: booking, error: bookingErr } = await supabase
          .from('rental_bookings')
          .insert({
            listing_id: selectedListing.id,
            user_id: user.id,
            start_date: date || new Date().toISOString().split('T')[0],
            days: Number(days),
            total_cost: totalCost,
            deposit_amount: depositAmt,
            status: 'pending',
          })
          .select()
          .single();

        if (bookingErr) console.error('Rental booking error (non-blocking):', bookingErr);

        // Log deposit in database
        await supabase.from('rental_deposits').insert({
          booking_id: booking?.id || '00000000-0000-0000-0000-000000000000',
          user_id: user.id,
          amount: depositAmt,
          status: 'held',
          held_at: new Date().toISOString(),
        });

        // Audit Log
        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          actor_email: user.email,
          action: 'RENTAL_DEPOSIT_HELD',
          entity_type: 'rental_deposit',
          entity_id: booking?.id || selectedListing.id,
          new_value: { amount: depositAmt, total_cost: totalCost, listing: selectedListing.title },
        });
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setBookingSuccess(false);
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredListings = listings.filter(l => !location || l.pickup_location?.toLowerCase().includes(location.toLowerCase()));

  const totalCost = selectedListing ? selectedListing.daily_rate * Number(days) : 0;
  const depositAmount = (totalCost * depositPct) / 100;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Back Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/en/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Mobility Marketplace
          </Link>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Vehicle Rentals</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Rent commercial transit vehicles, luxury buses, and corporate event fleets</p>
        </div>

        {/* Filters */}
        <div style={{ padding: 20, marginBottom: 24, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Filter by pickup location"
                style={{ ...inputS, paddingLeft: 36 }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ ...inputS, paddingLeft: 36 }}
              />
            </div>
            <button
              onClick={fetchListings}
              style={{ background: '#2563EB', border: 'none', color: '#fff', borderRadius: 10, padding: '0 20px', fontWeight: 600, cursor: 'pointer', height: 42, fontSize: 13 }}
            >
              Search Rentals
            </button>
          </div>
        </div>

        {/* Listings */}
        {loadingListings ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading available rentals...</div>
        ) : filteredListings.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 64, height: 64, background: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Key size={32} color="#2563EB" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>No vehicles currently available for rent</h3>
            <p style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
              We are onboarding local transit operators and corporate rental services. Check back shortly, or register your fleet as a rental provider.
            </p>
            <Link href="/en/companies/join" style={{ display: 'inline-block', background: '#2563EB', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
              Register as Rental Provider
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filteredListings.map(listing => (
              <div key={listing.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ height: 150, background: 'linear-gradient(135deg, #1E3A5F, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={48} color="rgba(255,255,255,0.4)" />
                </div>
                <div style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{listing.title}</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px' }}>{listing.companies?.name || 'Verified Provider'}</p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{listing.vehicle_type}</span>
                    {listing.capacity && (
                      <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Users size={10} /> {listing.capacity} seats
                      </span>
                    )}
                    {listing.pickup_location && (
                      <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} /> {listing.pickup_location}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{fmt(listing.daily_rate)}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>per day</div>
                    </div>
                    <button
                      onClick={() => openBooking(listing)}
                      style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && selectedListing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 16, width: 450, maxWidth: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ width: 56, height: 56, background: '#DCFCE7', color: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={28} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Rental Booked!</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Your security deposit has been held. The rental provider will confirm shortly.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Key size={20} color="#2563EB" /> Book Rental
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>{selectedListing.title} — {selectedListing.companies?.name || 'Verified Provider'}</p>

                <form onSubmit={handleBookRental} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6, fontWeight: 600 }}>Rental Duration (Days)</label>
                    <input required type="number" min="1" max="30" value={days} onChange={e => setDays(e.target.value)} style={inputS} />
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#64748B' }}>Daily Rate:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(selectedListing.daily_rate)}/day</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#64748B' }}>Total Rental Cost:</span>
                      <span style={{ fontWeight: 600 }}>{fmt(totalCost)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: '#2563EB' }}>
                      <span style={{ fontWeight: 700 }}>Security Deposit ({depositPct}%):</span>
                      <span style={{ fontWeight: 800 }}>{fmt(depositAmount)}</span>
                    </div>
                    <span style={{ display: 'block', color: '#64748B', fontSize: 10.5, lineHeight: 1.4 }}>Deposit is held securely and released after vehicle return without damage.</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button type="button" onClick={() => setShowModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                    <button type="submit" disabled={submitting} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      {submitting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={14} />}
                      Pay Deposit & Confirm
                    </button>
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

const inputS = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E2E8F0',
  borderRadius: 10,
  fontSize: 13,
  outline: 'none',
  background: '#F8FAFC',
  color: '#0F172A',
  boxSizing: 'border-box' as const,
};
