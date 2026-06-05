'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  MapPin, Navigation, CalendarDays, Users,
  Search, ArrowRight, Clock, ChevronRight,
  ShieldCheck, Lock, Headphones,
} from 'lucide-react'

// ─── How It Works ─────────────────────────────────────────────────────────────
const howSteps = [
  { icon: Search,       label: 'Search',       desc: 'Search for your preferred route' },
  { icon: Navigation,   label: 'Choose Trip',  desc: 'Select a trip that fits your schedule' },
  { icon: Users,        label: 'Select Seat',  desc: 'Pick your preferred seat' },
  { icon: Lock,         label: 'Pay Securely', desc: 'Make secure payment online' },
  { icon: ShieldCheck,  label: 'Get Ticket',   desc: 'Receive your e-ticket instantly' },
]

// ─── Types ───────────────────────────────────────────────────────────────────
interface RouteRow {
  id: string
  name: string
  origin: string
  destination: string
  price_range_min: number | null
  price_range_max: number | null
  duration_minutes: number | null
}

interface PlatformStats {
  users: number
  companies: number
  routes: number
}

const phrases = ["Book Safe.", "Save Money.", "Ride Easy.", "Explore More."]

export default function HomePage() {
  const router = useRouter()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState('1')

  const [text, setText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [loopNum, setLoopNum] = useState(0)
  const [typingSpeed, setTypingSpeed] = useState(150)

  // ─── Live data ────────────────────────────────────────────────────────────
  const [popularRoutes, setPopularRoutes] = useState<RouteRow[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = loopNum % phrases.length
      const fullText = phrases[current]

      if (isDeleting) {
        setText(fullText.substring(0, text.length - 1))
        setTypingSpeed(40)
      } else {
        setText(fullText.substring(0, text.length + 1))
        setTypingSpeed(100)
      }

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2500)
      } else if (isDeleting && text === '') {
        setIsDeleting(false)
        setLoopNum(loopNum + 1)
        setTypingSpeed(400)
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [text, isDeleting, loopNum, typingSpeed])

  // Load popular routes and stats from DB
  useEffect(() => {
    const loadData = async () => {
      try {
        // Popular routes
        const { data: routes } = await supabase
          .from('routes')
          .select('id, name, origin, destination, price_range_min, price_range_max, duration_minutes')
          .eq('is_popular', true)
          .eq('status', 'active')
          .limit(4)
        setPopularRoutes(routes ?? [])

        // Platform stats
        const [{ count: users }, { count: companies }, { count: routes: routeCount }] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
          supabase.from('routes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        ])
        setPlatformStats({ users: users ?? 0, companies: companies ?? 0, routes: routeCount ?? 0 })
      } catch (_) {}
    }
    loadData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({ from, to, date, passengers })
    router.push(`/en/search?${params.toString()}`)
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '32px 24px 0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
            {/* Left: Copy */}
            <div>
              <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginBottom: 8, minHeight: 92 }}>
                Travel Smart.
                <br />
                <span style={{ color: '#16A34A', borderRight: '4px solid #16A34A', paddingRight: '4px', animation: 'blink-cursor 1s step-end infinite' }}>
                  {text}
                </span>
              </h1>
              <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                Book bus tickets from verified transport companies across Nigeria. Find the best routes, great prices and comfortable rides.
              </p>
              {/* Trust pills */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                {[
                  { icon: ShieldCheck, label: 'Verified Operators', color: '#16A34A' },
                  { icon: Lock, label: 'Secure Payments', color: '#2563EB' },
                  { icon: Headphones, label: '24/7 Support', color: '#7C3AED' },
                ].map(({ icon: Icon, label, color }) => (
                  <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#374151', background: '#F9FAFB', border: '1px solid #E2E8F0', borderRadius: 999, padding: '4px 10px' }}>
                    <Icon size={13} style={{ color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Bus image */}
            <div style={{ position: 'relative' }}>
              <img
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80"
                alt="Luxury bus"
                style={{ width: '100%', borderRadius: 16, objectFit: 'cover', height: 200 }}
              />
              <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ width: 8, height: 8, background: '#16A34A', borderRadius: '50%' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#15803D' }}>RoutePro</span>
              </div>
            </div>
          </div>

          {/* ── SEARCH FORM ─────────────────────────────────────────────── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, marginTop: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <form onSubmit={handleSearch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                {/* From */}
                <div>
                  <label className="mt-label">From</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }}>
                      <MapPin size={15} />
                    </span>
                    <input
                      type="text"
                      value={from}
                      onChange={e => setFrom(e.target.value)}
                      placeholder="Leaving from"
                      required
                      className="mt-input"
                      style={{ paddingLeft: 30 }}
                    />
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="mt-label">To</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#DC2626' }}>
                      <MapPin size={15} />
                    </span>
                    <input
                      type="text"
                      value={to}
                      onChange={e => setTo(e.target.value)}
                      placeholder="Going to"
                      required
                      className="mt-input"
                      style={{ paddingLeft: 30 }}
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="mt-label">Date</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                      <CalendarDays size={15} />
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      className="mt-input"
                      style={{ paddingLeft: 30 }}
                    />
                  </div>
                </div>

                {/* Passengers */}
                <div>
                  <label className="mt-label">Passenger</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
                      <Users size={15} />
                    </span>
                    <select
                      value={passengers}
                      onChange={e => setPassengers(e.target.value)}
                      className="mt-input"
                      style={{ paddingLeft: 30, appearance: 'none', cursor: 'pointer' }}
                    >
                      {[1,2,3,4,5,6].map(n => (
                        <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" className="mt-btn-primary" style={{ height: 42, borderRadius: 8, paddingLeft: 20, paddingRight: 20, whiteSpace: 'nowrap' }}>
                  <Search size={15} />
                  Search Trips
                </button>
              </div>
            </form>
          </div>

          {/* Mobile search form (stacked) */}
          <style>{`
            @media (max-width: 640px) {
              .hero-grid { grid-template-columns: 1fr !important; }
              .search-grid { grid-template-columns: 1fr !important; }
              h1 { font-size: 32px !important; min-height: 72px !important; }
            }
            @keyframes blink-cursor { 50% { border-color: transparent } }
          `}</style>
        </div>
      </section>

      {/* ── POPULAR ROUTES ────────────────────────────────────────────────── */}
      <section style={{ padding: '28px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Popular Routes</h2>
            <a href="/en/search" style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              View all routes <ArrowRight size={14} />
            </a>
          </div>

          {popularRoutes.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
              <MapPin size={32} color="#CBD5E1" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#94A3B8', margin: '0 0 6px' }}>No popular routes yet</p>
              <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>Routes will appear here once transport operators join RoutePro.</p>
              <a href="/en/partner" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 700, color: '#16A34A', textDecoration: 'none' }}>Become a transport partner →</a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {popularRoutes.map((route) => {
                const minPrice = route.price_range_min
                const priceLabel = minPrice ? `From ₦${minPrice.toLocaleString()}` : 'Price TBD'
                const durationLabel = route.duration_minutes
                  ? `~${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60}m`
                  : 'Duration TBD'
                return (
                  <a
                    key={route.id}
                    href={`/en/search?from=${encodeURIComponent(route.origin)}&to=${encodeURIComponent(route.destination)}`}
                    className="route-card"
                    style={{ textDecoration: 'none', display: 'block', background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  >
                    <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{route.origin}</span>
                        <ArrowRight size={14} color="#16A34A" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{route.destination}</span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 10px 12px' }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#16A34A', marginBottom: 2 }}>{priceLabel}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Clock size={11} color="#94A3B8" />
                        <span style={{ fontSize: 11, color: '#64748B' }}>{durationLabel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} color="#94A3B8" />
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{route.name}</span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 28px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>How It Works</h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            {howSteps.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                <div className="how-step">
                  <div className="how-step-icon">
                    <step.icon size={20} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 6 }}>{step.label}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 1.4 }}>{step.desc}</p>
                </div>
                {i < howSteps.length - 1 && (
                  <div style={{ flex: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14, color: '#CBD5E1' }}>
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section style={{ background: '#1E293B', padding: '20px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { value: platformStats ? platformStats.users.toLocaleString() : '…', label: 'Registered Passengers' },
            { value: platformStats ? platformStats.companies.toLocaleString() : '…', label: 'Verified Operators' },
            { value: platformStats ? platformStats.routes.toLocaleString() : '…', label: 'Active Routes' },
            { value: '100%', label: 'Secure Payments' },
          ].map(({ value, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(22,163,74,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} color="#4ADE80" />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#475569', fontSize: 11, marginTop: 12 }}>
          RoutePro is a newly launched platform — building with transparency, growing with you.
        </p>
      </section>

    </div>
  )
}
