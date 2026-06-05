'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bus, CalendarDays, Clock, Search, Filter, Download } from 'lucide-react'

const allBookings = [
  { id: 'BK001', from: 'Lagos', to: 'Abuja', date: '2024-05-28', time: '08:00 AM', company: 'ABC Transport', seat: 'B3', status: 'confirmed', amount: 7500 },
  { id: 'BK002', from: 'Abuja', to: 'Kano', date: '2024-06-02', time: '09:00 AM', company: 'GUO Transport', seat: 'A1', status: 'pending', amount: 12000 },
  { id: 'BK003', from: 'Lagos', to: 'Ibadan', date: '2024-04-15', time: '07:00 AM', company: 'Chisco Transport', seat: 'C4', status: 'completed', amount: 4200 },
  { id: 'BK004', from: 'Port Harcourt', to: 'Owerri', date: '2024-03-10', time: '06:30 AM', company: 'God is Good Motors', seat: 'D2', status: 'completed', amount: 3800 },
  { id: 'BK005', from: 'Lagos', to: 'Abuja', date: '2024-02-20', time: '10:00 AM', company: 'ABC Transport', seat: 'A5', status: 'cancelled', amount: 7500 },
]

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

  const filtered = allBookings.filter(b => {
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
          {filtered.length === 0 ? (
            <div className="mt-card" style={{ padding: 40, textAlign: 'center' }}>
              <Bus size={40} color="#E2E8F0" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#94A3B8' }}>No bookings found</p>
              <Link href="/en/search" className="mt-btn-primary" style={{ display: 'inline-flex', marginTop: 14 }}>Book a Trip</Link>
            </div>
          ) : filtered.map(b => {
            const s = statusStyle[b.status]
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
