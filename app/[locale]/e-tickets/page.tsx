'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket,
  Download,
  Share2,
  QrCode,
  MapPin,
  Clock,
  Calendar,
  User,
  Bus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  ChevronRight,
  Phone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// ─── Types ──────────────────────────────────────────────────────────────────

type Trip = {
  departure_at: string
  arrival_at: string
  base_price: number
  routes: { origin: string; destination: string } | null
  companies: { name: string } | null
  vehicles: { name: string; plate_number: string } | null
}

type Booking = {
  id: string
  booking_reference: string
  status: string
  total_amount: number
  trip_id: string
  seat_number: string
  created_at: string
  passenger_id: string
  trips: Trip | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; stripe: string; icon: React.ReactNode }
> = {
  upcoming: {
    label: 'Upcoming',
    color: '#16A34A',
    bg: '#ECFDF5',
    stripe: '#16A34A',
    icon: <CheckCircle2 size={14} />,
  },
  checked_in: {
    label: 'Checked In',
    color: '#2563EB',
    bg: '#EFF6FF',
    stripe: '#2563EB',
    icon: <CheckCircle2 size={14} />,
  },
  completed: {
    label: 'Completed',
    color: '#64748B',
    bg: '#F1F5F9',
    stripe: '#94A3B8',
    icon: <CheckCircle2 size={14} />,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#DC2626',
    bg: '#FEF2F2',
    stripe: '#DC2626',
    icon: <XCircle size={14} />,
  },
  refunded: {
    label: 'Refunded',
    color: '#D97706',
    bg: '#FFFBEB',
    stripe: '#F59E0B',
    icon: <RefreshCw size={14} />,
  },
  confirmed: {
    label: 'Upcoming',
    color: '#16A34A',
    bg: '#ECFDF5',
    stripe: '#16A34A',
    icon: <CheckCircle2 size={14} />,
  },
  pending: {
    label: 'Pending',
    color: '#D97706',
    bg: '#FFFBEB',
    stripe: '#F59E0B',
    icon: <AlertCircle size={14} />,
  },
}

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status.toLowerCase()] ?? {
      label: status,
      color: '#64748B',
      bg: '#F1F5F9',
      stripe: '#94A3B8',
      icon: <AlertCircle size={14} />,
    }
  )
}

function fmt(dateStr: string | undefined, opts: Intl.DateTimeFormatOptions) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-NG', opts)
}

function normalizeStatus(status: string): string {
  const s = status.toLowerCase()
  if (s === 'confirmed') return 'upcoming'
  return s
}

// ─── QR Code Placeholder ─────────────────────────────────────────────────────

function QRPlaceholder({ reference }: { reference: string }) {
  return (
    <div
      style={{
        width: 160,
        height: 160,
        border: '3px solid #0F172A',
        borderRadius: 12,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: '#fff',
        position: 'relative',
      }}
    >
      {/* Corner squares */}
      {[
        { top: 10, left: 10 },
        { top: 10, right: 10 },
        { bottom: 10, left: 10 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: 28,
            height: 28,
            border: '3px solid #0F172A',
            borderRadius: 4,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              background: '#0F172A',
              borderRadius: 2,
              margin: '3px auto',
            }}
          />
        </div>
      ))}

      {/* Grid of small squares in the center */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,10px)',
          gap: 2,
          marginTop: 8,
        }}
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              background:
                [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].includes(i)
                  ? '#0F172A'
                  : 'transparent',
              borderRadius: 1,
            }}
          />
        ))}
      </div>

      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: '#0F172A',
          letterSpacing: 1.5,
          marginTop: 4,
        }}
      >
        {reference.substring(0, 8)}
      </span>
    </div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="mt-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ width: 6, background: '#E2E8F0', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: 28 }}>
        <div
          style={{
            height: 14,
            width: '40%',
            background: '#E2E8F0',
            borderRadius: 8,
            marginBottom: 14,
          }}
        />
        <div
          style={{ height: 22, width: '60%', background: '#E2E8F0', borderRadius: 8, marginBottom: 20 }}
        />
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ height: 12, width: 80, background: '#E2E8F0', borderRadius: 6 }} />
          <div style={{ height: 12, width: 80, background: '#E2E8F0', borderRadius: 6 }} />
          <div style={{ height: 12, width: 80, background: '#E2E8F0', borderRadius: 6 }} />
        </div>
      </div>
      <div
        style={{
          width: 160,
          borderLeft: '2px dashed #E2E8F0',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ height: 16, width: 80, background: '#E2E8F0', borderRadius: 6 }} />
        <div style={{ height: 36, width: '100%', background: '#E2E8F0', borderRadius: 8 }} />
      </div>
    </div>
  )
}

// ─── Ticket Modal ─────────────────────────────────────────────────────────────

function TicketModal({
  ticket,
  onClose,
}: {
  ticket: Booking
  onClose: () => void
}) {
  const cfg = getStatusConfig(ticket.status)
  const trip = ticket.trips
  const origin = trip?.routes?.origin ?? 'Origin'
  const destination = trip?.routes?.destination ?? 'Destination'
  const company = trip?.companies?.name ?? 'Operator'
  const vehicle = trip?.vehicles?.name ?? 'Vehicle'
  const plate = trip?.vehicles?.plate_number ?? '—'
  const depDate = fmt(trip?.departure_at, { dateStyle: 'full' })
  const depTime = fmt(trip?.departure_at, { timeStyle: 'short', hour12: true })
  const arrTime = fmt(trip?.arrival_at, { timeStyle: 'short', hour12: true })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          position: 'relative',
        }}
      >
        {/* Modal header strip */}
        <div
          style={{
            background: `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)`,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: '#16A34A',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ticket size={20} color="#fff" />
            </div>
            <div>
              <p style={{ color: '#94A3B8', fontSize: 11, fontWeight: 600, letterSpacing: 1.2 }}>
                ROUTEPRO E-TICKET
              </p>
              <p
                style={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 16,
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {company}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        {/* Status bar */}
        <div
          style={{
            background: cfg.bg,
            padding: '10px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: `3px solid ${cfg.stripe}`,
          }}
        >
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
          <span style={{ color: cfg.color, fontWeight: 700, fontSize: 13, letterSpacing: 0.8 }}>
            {cfg.label.toUpperCase()}
          </span>
          <span style={{ marginLeft: 'auto', color: '#64748B', fontSize: 12 }}>
            Ref:{' '}
            <strong style={{ color: '#0F172A' }}>{ticket.booking_reference}</strong>
          </span>
        </div>

        {/* Route */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                {origin}
              </p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Departure</p>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ height: 2, flex: 1, background: '#E2E8F0' }} />
              <Bus size={20} color="#16A34A" />
              <div style={{ height: 2, flex: 1, background: '#E2E8F0' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                {destination}
              </p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Arrival</p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          {[
            { icon: <Calendar size={16} />, label: 'Date', value: depDate },
            { icon: <Clock size={16} />, label: 'Departure', value: depTime },
            { icon: <Clock size={16} />, label: 'Arrival', value: arrTime },
            { icon: <User size={16} />, label: 'Seat Number', value: ticket.seat_number ?? '—' },
            { icon: <Bus size={16} />, label: 'Vehicle', value: vehicle },
            { icon: <Phone size={16} />, label: 'Plate No.', value: plate },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: '14px 20px',
                borderRight: i % 2 === 0 ? '1px solid #F1F5F9' : 'none',
                borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span style={{ color: '#16A34A', marginTop: 1 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: 0.5 }}>
                  {item.label.toUpperCase()}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* QR + Amount */}
        <div
          style={{
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            background: '#FAFAFA',
            borderTop: '2px dashed #E2E8F0',
          }}
        >
          <QRPlaceholder reference={ticket.booking_reference} />
          <div style={{ flex: 1, textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Amount Paid</p>
            <p
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              ₦{(ticket.total_amount ?? 0).toLocaleString()}
            </p>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              Booked {fmt(ticket.created_at, { dateStyle: 'medium' })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '16px 28px',
            display: 'flex',
            gap: 12,
            borderTop: '1px solid #F1F5F9',
            background: '#fff',
          }}
        >
          <button
            onClick={() => window.print()}
            className="mt-btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px',
            }}
          >
            <Download size={16} /> Download / Print
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'My E-Ticket', text: ticket.booking_reference })
              }
            }}
            className="mt-btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 20px',
            }}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  onView,
}: {
  ticket: Booking
  onView: () => void
}) {
  const cfg = getStatusConfig(ticket.status)
  const trip = ticket.trips
  const origin = trip?.routes?.origin ?? 'Origin'
  const destination = trip?.routes?.destination ?? 'Destination'
  const company = trip?.companies?.name ?? 'Operator'
  const depDate = fmt(trip?.departure_at, { dateStyle: 'medium' })
  const depTime = fmt(trip?.departure_at, { timeStyle: 'short', hour12: true })

  return (
    <div
      className="mt-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 12px 40px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
      }}
    >
      {/* Status stripe */}
      <div style={{ width: 6, background: cfg.stripe, flexShrink: 0 }} />

      {/* Main content */}
      <div style={{ flex: 1, padding: '22px 24px', minWidth: 0 }}>
        {/* Top row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: '#94A3B8',
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {company}
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{origin}</span>
              <ChevronRight size={18} color="#16A34A" />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{destination}</span>
            </div>
          </div>
          <span
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: cfg.bg,
              color: cfg.color,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            {cfg.icon}
            {cfg.label}
          </span>
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#94A3B8" />
            <span style={{ fontSize: 13, color: '#64748B' }}>{depDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="#94A3B8" />
            <span style={{ fontSize: 13, color: '#64748B' }}>{depTime}</span>
          </div>
          {ticket.seat_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} color="#94A3B8" />
              <span style={{ fontSize: 13, color: '#64748B' }}>Seat {ticket.seat_number}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ticket size={14} color="#94A3B8" />
            <span style={{ fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>
              {ticket.booking_reference}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={onView}
            className="mt-btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              fontSize: 13,
            }}
          >
            <QrCode size={14} /> View Ticket
          </button>
          <button
            onClick={() => window.print()}
            className="mt-btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 13,
            }}
            title="Download"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'My E-Ticket', text: ticket.booking_reference })
              }
            }}
            className="mt-btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 13,
            }}
            title="Share"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Right price panel */}
      <div
        style={{
          width: 120,
          flexShrink: 0,
          borderLeft: '2px dashed #E2E8F0',
          padding: '22px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAFA',
        }}
      >
        <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' }}>
          Total Paid
        </p>
        <p
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#0F172A',
            fontFamily: 'Outfit, sans-serif',
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          ₦{(ticket.total_amount ?? 0).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'checked_in', label: 'Checked-In' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
]

export default function ETicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchTickets() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/en/login')
        return
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(
          `*, trips(departure_at, arrival_at, base_price, routes(origin, destination), companies(name), vehicles(name, plate_number)), seat_number`
        )
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTickets(data as Booking[])
      }
      setLoading(false)
    }

    fetchTickets()
  }, [router])

  // Normalise status for filtering
  const normalisedTickets = tickets.map((t) => ({
    ...t,
    _normStatus: normalizeStatus(t.status),
  }))

  // Count per filter key
  const counts = FILTERS.reduce<Record<string, number>>((acc, f) => {
    acc[f.key] =
      f.key === 'all'
        ? normalisedTickets.length
        : normalisedTickets.filter((t) => t._normStatus === f.key).length
    return acc
  }, {})

  // Apply filter + search
  const displayed = normalisedTickets.filter((t) => {
    const matchesFilter = activeFilter === 'all' || t._normStatus === activeFilter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      t.booking_reference?.toLowerCase().includes(q) ||
      t.trips?.routes?.origin?.toLowerCase().includes(q) ||
      t.trips?.routes?.destination?.toLowerCase().includes(q) ||
      t.trips?.companies?.name?.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  return (
    <>
      {/* Pulse animation for skeletons */}
      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1 }
          50% { opacity:0.5 }
        }
      `}</style>

      <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg,#16A34A,#15803D)',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(22,163,74,0.3)',
                }}
              >
                <Ticket size={26} color="#fff" />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#0F172A',
                    fontFamily: 'Outfit, sans-serif',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  My E-Tickets
                </h1>
                <p style={{ color: '#64748B', fontSize: 14, margin: '4px 0 0' }}>
                  Access all your booked journeys in one place.
                </p>
              </div>
            </div>

            {/* Quick action */}
            <Link
              href="/en/search"
              className="mt-btn-primary"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 22px',
                fontSize: 14,
              }}
            >
              <Plus size={16} /> Book New Trip
            </Link>
          </div>

          {/* ── Search Bar ───────────────────────────────────────────── */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search
              size={16}
              color="#94A3B8"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              className="mt-input"
              placeholder="Search by reference, route, or operator…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 42, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* ── Filter Tabs ───────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 24,
              overflowX: 'auto',
              paddingBottom: 4,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {FILTERS.map((f) => {
              const active = activeFilter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: active ? '2px solid #16A34A' : '2px solid #E2E8F0',
                    background: active ? '#16A34A' : '#fff',
                    color: active ? '#fff' : '#64748B',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  {f.label}
                  {counts[f.key] > 0 && (
                    <span
                      style={{
                        background: active ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                        color: active ? '#fff' : '#0F172A',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '1px 7px',
                        minWidth: 20,
                        textAlign: 'center',
                      }}
                    >
                      {counts[f.key]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Content ───────────────────────────────────────────────── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : displayed.length === 0 ? (
            <div
              className="mt-card"
              style={{
                padding: '60px 40px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  background: '#F1F5F9',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Ticket size={44} color="#CBD5E1" />
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#0F172A',
                  fontFamily: 'Outfit, sans-serif',
                  margin: '0 0 10px',
                }}
              >
                No tickets found
              </h2>
              <p style={{ color: '#64748B', marginBottom: 32, fontSize: 15 }}>
                {searchQuery
                  ? 'No tickets match your search. Try a different keyword.'
                  : tickets.length === 0
                  ? "You haven't booked any trips yet."
                  : 'No tickets in this category.'}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                  href="/en/search"
                  className="mt-btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 28px',
                  }}
                >
                  <Bus size={16} /> Book a Trip
                </Link>
                <Link
                  href="/en/search"
                  className="mt-btn-outline"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 28px',
                  }}
                >
                  <Search size={16} /> Search Routes
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayed.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onView={() => setSelectedTicket(ticket)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </>
  )
}
