'use client'

import Link from 'next/link'
import { Bus, CalendarDays, Wallet, Users, ArrowUpRight, TrendingUp, Settings, MapPin } from 'lucide-react'

const stats = [
  { label: 'Total Revenue', value: '₦4.2M', icon: Wallet, color: '#16A34A', bg: '#DCFCE7', trend: '+12%' },
  { label: 'Total Trips', value: '156', icon: Bus, color: '#2563EB', bg: '#DBEAFE', trend: '+5%' },
  { label: 'Active Routes', value: '14', icon: MapPin, color: '#7C3AED', bg: '#EDE9FE', trend: '0%' },
  { label: 'Passengers', value: '3.2k', icon: Users, color: '#D97706', bg: '#FEF3C7', trend: '+18%' },
]

const recentTrips = [
  { id: 'TR-101', route: 'Lagos - Abuja', date: 'May 28', time: '08:00 AM', seats: '38/42', revenue: 285000, status: 'Upcoming' },
  { id: 'TR-102', route: 'Abuja - Kano', date: 'May 28', time: '09:00 AM', seats: '24/30', revenue: 288000, status: 'Upcoming' },
  { id: 'TR-098', route: 'Lagos - Ibadan', date: 'May 27', time: '07:00 AM', seats: '14/14', revenue: 58800, status: 'Completed' },
]

export default function CompanyDashboard() {
  const companyName = 'ABC Transport'

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Company Portal</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              {companyName}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/en/company/trips/new" className="mt-btn-primary">
              <Bus size={16} /> Create Trip
            </Link>
            <Link href="/en/company/settings" className="mt-btn-outline" style={{ padding: '10px' }}>
              <Settings size={18} />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((s) => (
            <div key={s.label} className="mt-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 2, background: '#DCFCE7', padding: '2px 8px', borderRadius: 999 }}>
                  <TrendingUp size={12} /> {s.trend}
                </span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* 2 Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          
          {/* Active Trips */}
          <div className="mt-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Recent & Upcoming Trips</h2>
              <Link href="/en/company/trips" style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Route</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Schedule</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Seats</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Revenue</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map(trip => (
                  <tr key={trip.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 0' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{trip.route}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{trip.id}</p>
                    </td>
                    <td style={{ padding: '16px 0', fontSize: 13, color: '#374151' }}>
                      {trip.date} · {trip.time}
                    </td>
                    <td style={{ padding: '16px 0', fontSize: 13, color: '#374151' }}>{trip.seats}</td>
                    <td style={{ padding: '16px 0', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>₦{trip.revenue.toLocaleString()}</td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                        background: trip.status === 'Completed' ? '#E0F2FE' : '#FEF9C3',
                        color: trip.status === 'Completed' ? '#0369A1' : '#854D0E'
                      }}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="mt-card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Management</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/en/company/fleet" className="mt-sidebar-item" style={{ margin: 0, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Bus size={18} /> Manage Fleet
                </Link>
                <Link href="/en/company/routes" className="mt-sidebar-item" style={{ margin: 0, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <MapPin size={18} /> Active Routes
                </Link>
                <Link href="/en/company/wallet" className="mt-sidebar-item" style={{ margin: 0, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Wallet size={18} /> Wallet & Payouts
                </Link>
              </div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)', borderRadius: 16, padding: 24, color: 'white' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Next Payout</p>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>₦1,250,000</p>
              <p style={{ fontSize: 13, color: '#BFDBFE', marginBottom: 16 }}>Scheduled for May 30, 2024</p>
              <Link href="/en/company/wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'white', textDecoration: 'none' }}>
                View Payouts <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
