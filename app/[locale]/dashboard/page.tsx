'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Ticket, Star, TrendingUp,
  Clock, MapPin, ArrowRight, Bus, ChevronRight, Bell
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// Mock data for dashboard
const mockBookings = [
  {
    id: 'BK001',
    from: 'Lagos', to: 'Abuja',
    date: '2024-05-28', time: '08:00 AM',
    company: 'ABC Transport',
    seat: 'B3',
    status: 'confirmed',
    amount: 7500,
  },
  {
    id: 'BK002',
    from: 'Abuja', to: 'Kano',
    date: '2024-06-02', time: '09:00 AM',
    company: 'GUO Transport',
    seat: 'A1',
    status: 'pending',
    amount: 12000,
  },
  {
    id: 'BK003',
    from: 'Lagos', to: 'Ibadan',
    date: '2024-04-15', time: '07:00 AM',
    company: 'Chisco Transport',
    seat: 'C4',
    status: 'completed',
    amount: 4200,
  },
]

const stats = [
  { label: 'Total Trips', value: '12', icon: Bus, color: '#16A34A', bg: '#DCFCE7' },
  { label: 'Upcoming', value: '2', icon: CalendarDays, color: '#2563EB', bg: '#DBEAFE' },
  { label: 'E-Tickets', value: '12', icon: Ticket, color: '#7C3AED', bg: '#EDE9FE' },
  { label: 'Reviews Left', value: '3', icon: Star, color: '#D97706', bg: '#FEF3C7' },
]

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: '#DCFCE7', color: '#15803D', label: 'Confirmed' },
  pending:   { bg: '#FEF9C3', color: '#854D0E', label: 'Pending' },
  completed: { bg: '#E0F2FE', color: '#0369A1', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
}

export default function PassengerDashboard() {
  const [userName, setUserName] = useState('User')
  const [initials, setInitials] = useState('U')

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const name = user.user_metadata?.full_name || 'Passenger'
          setUserName(name.split(' ')[0])
          setInitials(name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase())
        }
      } catch (err) {
        console.error('Error loading user in dashboard:', err)
      }
    }
    loadUser()
  }, [])

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Welcome back 👋</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              {userName}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ width: 38, height: 38, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={18} color="#64748B" />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#DC2626', borderRadius: '50%', border: '2px solid #fff' }} />
            </button>
            <Link href="/en/dashboard/profile">
              <div style={{ width: 38, height: 38, background: '#16A34A', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {initials}
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
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
        <div className="mt-card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
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
            {mockBookings.map(booking => {
              const s = statusStyle[booking.status]
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
