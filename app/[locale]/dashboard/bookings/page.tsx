'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Bus, CalendarDays, Clock, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled']

const statusStyle: Record<string, { bg: string; color: string }> = {
  confirmed: { bg: '#DCFCE7', color: '#15803D' },
  pending:   { bg: '#FEF9C3', color: '#854D0E' },
  completed: { bg: '#E0F2FE', color: '#0369A1' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626' },
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBookings() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            reference,
            seat_numbers,
            total_price,
            status,
            created_at,
            trip:trip_id (
              departure_at,
              route:route_id (origin, destination),
              company:company_id (name)
            )
          `)
          .eq('user_id', user.id)

        if (error) throw error

        if (data) {
          const formatted = data.map((b: any) => {
            const trip = Array.isArray(b.trip) ? b.trip[0] : b.trip
            const route = trip?.route ? (Array.isArray(trip.route) ? trip.route[0] : trip.route) : null
            const company = trip?.company ? (Array.isArray(trip.company) ? trip.company[0] : trip.company) : null
            const depDate = trip?.departure_at ? new Date(trip.departure_at) : new Date()

            return {
              id: b.reference || b.id.slice(0, 8),
              from: route?.origin || 'Unknown',
              to: route?.destination || 'Unknown',
              date: depDate.toLocaleDateString(),
              time: depDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
              company: company?.name || 'Transport Operator',
              seat: Array.isArray(b.seat_numbers) ? b.seat_numbers.join(', ') : (b.seat_numbers || 'N/A'),
              status: b.status?.toLowerCase() || 'pending',
              amount: b.total_price || 0
            }
          })
          setBookings(formatted)
        }
      } catch (err) {
        console.error('Error fetching bookings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  const filtered = bookings.filter(b => {
    const matchTab = activeTab === 'All' ||
      (activeTab === 'Upcoming' && (b.status === 'confirmed' || b.status === 'pending')) ||
      (activeTab === 'Completed' && b.status === 'completed') ||
      (activeTab === 'Cancelled' && b.status === 'cancelled')
    const matchSearch = b.from.toLowerCase().includes(search.toLowerCase()) ||
      b.to.toLowerCase().includes(search.toLowerCase()) ||
      b.company.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>My Bookings</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>View and manage all your trip bookings</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by route, company or booking ID..."
            className="mt-input"
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: activeTab === tab ? '#FFFFFF' : 'transparent',
                color: activeTab === tab ? '#16A34A' : '#64748B',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >{tab}</button>
          ))}
        </div>

        {/* Booking Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading your bookings...</div>
          ) : filtered.length === 0 ? (
            <div className="mt-card" style={{ padding: 40, textAlign: 'center' }}>
              <Bus size={40} color="#E2E8F0" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#94A3B8' }}>No bookings found</p>
              <Link href="/en/search" className="mt-btn-primary" style={{ display: 'inline-flex', marginTop: 14 }}>Book a Trip</Link>
            </div>
          ) : filtered.map(b => {
            const s = statusStyle[b.status] || { bg: '#F1F5F9', color: '#64748B' }
            return (
              <Link key={b.id} href={`/en/dashboard/bookings/${b.id}`} style={{ textDecoration: 'none' }}>
                <div className="mt-card" style={{ padding: 16, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bus size={18} color="#16A34A" />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {b.from} <ArrowRight size={13} color="#94A3B8" /> {b.to}
                        </p>
                        <p style={{ fontSize: 12, color: '#64748B' }}>{b.company} · Seat {b.seat}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize' }}>{b.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} /> {b.date}</span>
                      <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {b.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>₦{b.amount.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>#{b.id}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
