'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Ticket, Star, TrendingUp,
  Clock, MapPin, ArrowRight, Bus, ChevronRight, Bell
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: '#DCFCE7', color: '#15803D', label: 'Confirmed' },
  pending:   { bg: '#FEF9C3', color: '#854D0E', label: 'Pending' },
  completed: { bg: '#E0F2FE', color: '#0369A1', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
}

import NotificationPanel from '@/components/layout/NotificationPanel'

export default function PassengerDashboard() {
  const [userName, setUserName] = useState('User')
  const [initials, setInitials] = useState('U')
  const [bookings, setBookings] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const name = user.user_metadata?.full_name || 'Passenger'
        setUserName(name.split(' ')[0])
        setInitials(name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase())

        // Fetch bookings for statistics calculation
        const { data: bookingData, error } = await supabase
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
          .order('created_at', { ascending: false })

        if (error) throw error

        if (bookingData) {
          const formatted = bookingData.map((b: any) => {
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

          setBookings(formatted.slice(0, 3)) // recent 3

          // Calculate stats
          const totalTrips = formatted.length
          const upcomingTrips = formatted.filter(b => b.status === 'confirmed' || b.status === 'pending').length
          const completedTrips = formatted.filter(b => b.status === 'completed').length

          setStats([
            { label: 'Total Trips', value: totalTrips.toString(), icon: Bus, color: '#16A34A', bg: '#DCFCE7' },
            { label: 'Upcoming', value: upcomingTrips.toString(), icon: CalendarDays, color: '#2563EB', bg: '#DBEAFE' },
            { label: 'Completed', value: completedTrips.toString(), icon: Ticket, color: '#7C3AED', bg: '#EDE9FE' },
            { label: 'Recent', value: formatted.length > 0 ? formatted[0].date : 'N/A', icon: Clock, color: '#D97706', bg: '#FEF3C7' },
          ])
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  return (
    <div className="page-enter" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 16 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(16px, 3vw, 28px)' }}>


        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Welcome back 👋</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              {userName}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <NotificationPanel />
            <Link href="/en/dashboard/profile">
              <div style={{ width: 38, height: 38, background: '#16A34A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {initials}
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Grid — responsive: 4 cols desktop → 2 cols tablet → 1 col mobile */}
        <div className="mt-stats-row stagger-children" style={{ marginBottom: 24 }}>

          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="mt-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-card" style={{ padding: 'clamp(14px, 2.5vw, 20px)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Quick Actions</h2>
          <div className="mt-grid mt-grid-2" style={{ gap: 10 }}>

            <Link href="/en/search" className="mt-btn-primary" style={{ justifyContent: 'center', padding: '12px' }}>
              <Bus size={16} /> Book a Trip
            </Link>
            <Link href="/en/dashboard/bookings" className="mt-btn-outline" style={{ justifyContent: 'center', padding: '12px' }}>
              <CalendarDays size={16} /> My Bookings
            </Link>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="mt-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Recent Bookings</h2>
            <Link href="/en/dashboard/bookings" style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: 20 }}>Loading dashboard summary...</p>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <p style={{ fontSize: 13, color: '#94A3B8' }}>No bookings found.</p>
                <Link href="/en/search" style={{ fontSize: 13, color: '#16A34A', textDecoration: 'none', display: 'inline-block', marginTop: 8, fontWeight: 600 }}>Book your first trip now</Link>
              </div>
            ) : bookings.map(booking => {
              const s = statusStyle[booking.status] || { bg: '#F1F5F9', color: '#64748B', label: booking.status }
              return (
                <Link key={booking.id} href={`/en/dashboard/bookings/${booking.id}`} style={{ textDecoration: 'none', display: 'block', padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9', transition: 'border-color 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, background: '#DCFCE7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bus size={16} color="#16A34A" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {booking.from} <ArrowRight size={12} color="#94A3B8" /> {booking.to}
                        </p>
                        <p style={{ fontSize: 11, color: '#64748B' }}>{booking.company} · Seat {booking.seat}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 999 }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CalendarDays size={11} /> {booking.date}
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={11} /> {booking.time}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>₦{booking.amount.toLocaleString()}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
