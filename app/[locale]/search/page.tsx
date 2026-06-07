'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Filter, ArrowRight, Clock, Wifi, Wind,
  Star, ChevronDown, Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

function getDateTabs() {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const result = []
  for (let i = -1; i < 4; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    result.push({
      label: i === 0 ? 'Today' : `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`,
      date: d.toISOString().split('T')[0],
    })
  }
  return result
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginLeft: 2 }}>{rating}</span>
    </span>
  )
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState(date)
  const [sortBy, setSortBy] = useState('Earliest')
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const dateTabs = getDateTabs()

  const fetchTrips = async () => {
    setLoading(true)
    try {
      // Fetch matching routes and active trips
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          departure_at,
          arrival_at,
          base_price,
          currency,
          status,
          route:route_id!inner (origin, destination),
          company:company_id (name, status),
          vehicle:vehicle_id (name, comfort_class, amenities, capacity)
        `)
        .eq('status', 'SCHEDULED')
        .ilike('route.origin', `%${from}%`)
        .ilike('route.destination', `%${to}%`)

      if (error) throw error

      if (data && data.length > 0) {
        const formatted = data.map(t => {
          const depTime = new Date(t.departure_at)
          const arrTime = new Date(t.arrival_at)
          const diffMs = arrTime.getTime() - depTime.getTime()
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

          // Supabase joins may return arrays; safely extract the first element
          const company = Array.isArray(t.company) ? t.company[0] : t.company
          const route = Array.isArray(t.route) ? t.route[0] : t.route
          const vehicle = Array.isArray(t.vehicle) ? t.vehicle[0] : t.vehicle

          return {
            id: t.id,
            company: company?.name || 'Transport Provider',
            companyInitials: (company?.name || 'TP').slice(0, 2).toUpperCase(),
            companyColor: '#1E40AF',
            rating: 4.6,
            verified: company?.status === 'APPROVED',
            class: vehicle?.comfort_class || 'Standard',
            amenities: Array.isArray(vehicle?.amenities) ? vehicle.amenities : [],
            departure: depTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
            arrival: arrTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
            duration: `${diffHrs}h ${diffMins}m`,
            from: route?.origin || from,
            to: route?.destination || to,
            seatsLeft: vehicle?.capacity || 14,
            price: t.base_price,
            currency: t.currency === 'NGN' ? '₦' : '$',
            isDemo: false
          }
        })
        setTrips(formatted)
      } else {
        setTrips([])
      }
    } catch (err) {
      console.error('Search query error:', err)
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [from, to, selectedDate])

  // Sorting
  const sortedTrips = [...trips].sort((a, b) => {
    if (sortBy === 'Earliest') {
      return a.departure.localeCompare(b.departure)
    }
    if (sortBy === 'Price (Low to High)') {
      return a.price - b.price
    }
    if (sortBy === 'Price (High to Low)') {
      return b.price - a.price
    }
    if (sortBy === 'Rating') {
      return b.rating - a.rating
    }
    return 0
  })

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>

      {/* Search Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '12px 20px', position: 'sticky', top: 64, zIndex: 30 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Back + route title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 14 }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                {from || 'Anywhere'} <ArrowRight size={14} color="#94A3B8" /> {to || 'Anywhere'}
              </h1>
              <p style={{ fontSize: 12, color: '#94A3B8' }}>{selectedDate} • Search Results</p>
            </div>
            <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
              <Filter size={14} /> Filter
            </button>
          </div>

          {/* Date tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {dateTabs.map(tab => {
              const isActive = tab.date === selectedDate
              return (
                <button
                  key={tab.date}
                  onClick={() => setSelectedDate(tab.date)}
                  style={{
                    background: isActive ? '#16A34A' : '#F8FAFC',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    border: `1px solid ${isActive ? '#16A34A' : '#E2E8F0'}`,
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 20px' }}>
        {/* Results count + sort */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
            <strong style={{ color: '#0F172A' }}>{sortedTrips.length} {sortedTrips.length === 1 ? 'Trip' : 'Trips'} Found</strong>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#374151', cursor: 'pointer', background: '#fff' }}
            >
              <option value="Earliest">Earliest</option>
              <option value="Price (Low to High)">Price (Low to High)</option>
              <option value="Price (High to Low)">Price (High to Low)</option>
              <option value="Rating">Rating</option>
            </select>
          </div>
        </div>

        {/* Trip Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Searching available departures...</div>
          ) : sortedTrips.length === 0 ? (
            <div className="mt-card" style={{ padding: 40, textAlign: 'center' }}>
              <Search size={40} color="#E2E8F0" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#94A3B8' }}>No trips found for this route on the selected date.</p>
            </div>
          ) : sortedTrips.map(trip => (
            <div key={trip.id} className="mt-card" style={{ padding: 16, position: 'relative' }}>
              {/* Company header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: trip.companyColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {trip.companyInitials.slice(0, 2)}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{trip.company}</p>
                    <StarRow rating={trip.rating} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {trip.verified && <span className="badge-verified">Verified</span>}
                </div>
              </div>

              {/* Class + amenities */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="badge-class">{trip.class}</span>
                {trip.amenities.map((a: string) => (
                  <span key={a} style={{ background: '#F1F5F9', color: '#374151', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4 }}>
                    {a.includes('Air') || a.includes('AC') ? '❄️' : a.includes('WiFi') ? '📶' : '🔌'} {a}
                  </span>
                ))}
              </div>

              {/* Time + route */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{trip.departure}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>{trip.from}</p>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8' }}>
                    <Clock size={12} />
                    <span style={{ fontSize: 11 }}>{trip.duration}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%' }}>
                    <div style={{ height: 1.5, flex: 1, background: '#E2E8F0' }} />
                    <ArrowRight size={14} color="#94A3B8" />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{trip.arrival}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>{trip.to}</p>
                </div>
              </div>

              {/* Seats + Price + CTA */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#94A3B8' }}>{trip.seatsLeft} seats left</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                    {trip.currency}{trip.price.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/en/trips/${trip.id}?from=${from}&to=${to}`)}
                  className="mt-btn-primary"
                >
                  View Seats
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
