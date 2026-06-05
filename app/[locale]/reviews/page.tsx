'use client'

import React, { useState, useMemo } from 'react'
import {
  Star,
  Search,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trophy,
  Filter,
  X,
  BarChart3,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Review {
  id: number
  name: string
  initials: string
  avatarColor: string
  route: string
  company: string
  date: string
  rating: number
  text: string
  subRatings: { comfort: number; driver: number; timeliness: number; cleanliness: number }
  verified: boolean
}

interface Company {
  rank: number
  name: string
  avgRating: number
  reviewCount: number
  color: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ALL_REVIEWS: Review[] = [
  {
    id: 1,
    name: 'Adaeze Okonkwo',
    initials: 'AO',
    avatarColor: '#7C3AED',
    route: 'Lagos → Abuja',
    company: 'ABC Transport',
    date: 'Jun 2, 2026',
    rating: 5,
    text: 'Absolutely smooth journey! The driver was professional and the bus was spotless. Will book again!',
    subRatings: { comfort: 5, driver: 5, timeliness: 5, cleanliness: 5 },
    verified: true,
  },
  {
    id: 2,
    name: 'Emeka Nwachukwu',
    initials: 'EN',
    avatarColor: '#0891B2',
    route: 'Abuja → Kano',
    company: 'GUO Transport',
    date: 'May 29, 2026',
    rating: 4,
    text: 'Good experience overall. Bus departed on time and seats were comfortable. AC could be colder.',
    subRatings: { comfort: 4, driver: 5, timeliness: 5, cleanliness: 4 },
    verified: true,
  },
  {
    id: 3,
    name: 'Fatima Aliyu',
    initials: 'FA',
    avatarColor: '#DC2626',
    route: 'Lagos → Ibadan',
    company: 'Chisco Transport',
    date: 'May 25, 2026',
    rating: 5,
    text: 'Best road trip I have had in Nigeria. The seat was spacious and the journey was peaceful.',
    subRatings: { comfort: 5, driver: 5, timeliness: 4, cleanliness: 5 },
    verified: true,
  },
  {
    id: 4,
    name: 'Tunde Adeyemi',
    initials: 'TA',
    avatarColor: '#D97706',
    route: 'PH → Owerri',
    company: 'Peace Mass Transit',
    date: 'May 20, 2026',
    rating: 3,
    text: 'Average experience. The bus was 30 mins late but driver made up time. Bus was clean enough.',
    subRatings: { comfort: 3, driver: 4, timeliness: 2, cleanliness: 3 },
    verified: true,
  },
  {
    id: 5,
    name: 'Chioma Eze',
    initials: 'CE',
    avatarColor: '#16A34A',
    route: 'Enugu → Lagos',
    company: 'God is Good Motors',
    date: 'May 15, 2026',
    rating: 5,
    text: 'Exceptional service from start to finish. QR code scan was fast and boarding was orderly.',
    subRatings: { comfort: 5, driver: 5, timeliness: 5, cleanliness: 5 },
    verified: true,
  },
  {
    id: 6,
    name: 'Biodun Olatunji',
    initials: 'BO',
    avatarColor: '#9333EA',
    route: 'Lagos → Benin',
    company: 'Greener Line',
    date: 'May 10, 2026',
    rating: 4,
    text: 'Reliable company. Journey was smooth apart from one traffic stop. Would recommend to friends.',
    subRatings: { comfort: 4, driver: 4, timeliness: 4, cleanliness: 5 },
    verified: true,
  },
]

const TOP_COMPANIES: Company[] = [
  { rank: 1, name: 'God is Good Motors', avgRating: 4.9, reviewCount: 12840, color: '#16A34A' },
  { rank: 2, name: 'ABC Transport',       avgRating: 4.8, reviewCount: 10320, color: '#0891B2' },
  { rank: 3, name: 'GUO Transport',       avgRating: 4.7, reviewCount: 8950,  color: '#7C3AED' },
  { rank: 4, name: 'Chisco Transport',    avgRating: 4.6, reviewCount: 7210,  color: '#D97706' },
  { rank: 5, name: 'Greener Line',        avgRating: 4.5, reviewCount: 5630,  color: '#9333EA' },
]

const STAR_FILTERS = ['All', '5', '4', '3', '2', '1'] as const
type StarFilter = typeof STAR_FILTERS[number]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? '#F59E0B' : 'transparent'}
          color={i <= rating ? '#F59E0B' : '#CBD5E1'}
          style={{ flexShrink: 0 }}
        />
      ))}
    </span>
  )
}

function SubRatingBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100
  const color =
    value >= 5 ? '#16A34A' : value >= 4 ? '#22C55E' : value >= 3 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{ color: '#64748B', width: 72, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 5,
          background: '#E2E8F0',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ color: '#64748B', fontWeight: 600, width: 20, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className="mt-card"
      style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = '0 12px 36px rgba(0,0,0,0.12)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.boxShadow = ''
        el.style.transform = ''
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: review.avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: 0.5,
          }}
        >
          {review.initials}
        </div>

        {/* Name + Route */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0F172A',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {review.name}
            </span>
            {review.verified && (
              <span
                className="badge-verified"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 99,
                }}
              >
                <CheckCircle size={9} />
                Verified
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>{review.route}</span>
            {' · '}
            <span>{review.company}</span>
          </div>
        </div>

        {/* Date */}
        <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0 }}>{review.date}</span>
      </div>

      {/* Stars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StarDisplay rating={review.rating} size={15} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color:
              review.rating >= 5
                ? '#16A34A'
                : review.rating >= 4
                ? '#0891B2'
                : review.rating >= 3
                ? '#D97706'
                : '#EF4444',
          }}
        >
          {review.rating}.0
        </span>
      </div>

      {/* Review Text */}
      <p
        style={{
          fontSize: 14,
          color: '#334155',
          lineHeight: 1.7,
          margin: 0,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Sub-ratings */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <SubRatingBar label="Comfort" value={review.subRatings.comfort} />
        <SubRatingBar label="Driver" value={review.subRatings.driver} />
        <SubRatingBar label="Timeliness" value={review.subRatings.timeliness} />
        <SubRatingBar label="Cleanliness" value={review.subRatings.cleanliness} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const [starFilter, setStarFilter] = useState<StarFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const TOTAL_PAGES = 24

  const filtered = useMemo(() => {
    let result = ALL_REVIEWS
    if (starFilter !== 'All') {
      const s = parseInt(starFilter)
      result = result.filter((r) => r.rating === s)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.route.toLowerCase().includes(q)
      )
    }
    return result
  }, [starFilter, searchQuery])

  const clearFilters = () => {
    setStarFilter('All')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const hasActiveFilter = starFilter !== 'All' || searchQuery.trim() !== ''

  return (
    <div
      style={{
        background: '#F8FAFC',
        minHeight: '100vh',
        padding: '24px 16px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ══════════════════ HERO ══════════════════ */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #16A34A22 100%)',
            borderRadius: 20,
            padding: '52px 40px',
            marginBottom: 32,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blobs */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'rgba(22,163,74,0.15)',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(124,58,237,0.15)',
              filter: 'blur(40px)',
            }}
          />

          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(22,163,74,0.2)',
              border: '1px solid rgba(22,163,74,0.4)',
              borderRadius: 99,
              padding: '6px 16px',
              marginBottom: 20,
            }}
          >
            <Star size={13} fill="#4ADE80" color="#4ADE80" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#4ADE80',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Verified Travel Reviews
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(26px, 5vw, 42px)',
              fontWeight: 800,
              color: '#FFFFFF',
              fontFamily: 'Outfit, sans-serif',
              margin: '0 0 14px',
              lineHeight: 1.15,
            }}
          >
            Trusted by Thousands of Travelers
          </h1>
          <p
            style={{
              fontSize: 16,
              color: '#94A3B8',
              maxWidth: 520,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            Real experiences from real passengers across Nigeria — verified, unfiltered, and
            trustworthy.
          </p>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              maxWidth: 760,
              margin: '0 auto',
            }}
          >
            {[
              { icon: <MessageSquare size={20} />, value: '48,291', label: 'Total Reviews', color: '#60A5FA' },
              { icon: <Star size={20} fill="#F59E0B" color="#F59E0B" />, value: '4.7★', label: 'Avg Rating', color: '#F59E0B' },
              { icon: <Award size={20} />, value: '127', label: 'Verified Companies', color: '#A78BFA' },
              { icon: <TrendingUp size={20} />, value: '820K+', label: 'Trips Completed', color: '#34D399' },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14,
                  padding: '18px 12px',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                }
              >
                <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════ FILTER BAR ══════════════════ */}
        <div
          className="mt-card"
          style={{
            padding: '18px 20px',
            marginBottom: 28,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Star filter tabs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
              flex: '1 1 auto',
            }}
          >
            <Filter size={14} color="#64748B" style={{ marginRight: 4 }} />
            {STAR_FILTERS.map((f) => {
              const active = starFilter === f
              return (
                <button
                  key={f}
                  onClick={() => {
                    setStarFilter(f)
                    setCurrentPage(1)
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '6px 14px',
                    borderRadius: 99,
                    border: active ? '1.5px solid #16A34A' : '1.5px solid #E2E8F0',
                    background: active ? '#16A34A' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#64748B',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = '#16A34A'
                      e.currentTarget.style.color = '#16A34A'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = '#E2E8F0'
                      e.currentTarget.style.color = '#64748B'
                    }
                  }}
                >
                  {f === 'All' ? (
                    'All'
                  ) : (
                    <>
                      {'★'.repeat(parseInt(f))}
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: 220, flex: '0 1 260px' }}>
            <Search
              size={15}
              color="#94A3B8"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              className="mt-input"
              placeholder="Search reviews…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              style={{ paddingLeft: 36, paddingRight: searchQuery ? 32 : 12, width: '100%', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Clear filters button */}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1.5px solid #FCA5A5',
                background: '#FEF2F2',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.15s',
              }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* ══════════════════ MAIN CONTENT ══════════════════ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: filtered.length === 0 ? '1fr' : '1fr',
            gap: 24,
          }}
        >
          {/* Review Cards or Empty State */}
          {filtered.length === 0 ? (
            /* ── EMPTY STATE ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <MessageSquare size={36} color="#94A3B8" />
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#0F172A',
                  fontFamily: 'Outfit, sans-serif',
                  margin: '0 0 10px',
                }}
              >
                No reviews match your search
              </h2>
              <p
                style={{ fontSize: 15, color: '#64748B', marginBottom: 28, maxWidth: 340, lineHeight: 1.6 }}
              >
                Try adjusting your star filter or search term, or clear all filters to see all
                reviews.
              </p>
              <button onClick={clearFilters} className="mt-btn-primary" style={{ cursor: 'pointer' }}>
                Clear All Filters
              </button>
            </div>
          ) : (
            /* ── REVIEW GRID ── */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: 20,
              }}
            >
              {filtered.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════ TOP COMPANIES LEADERBOARD ══════════════════ */}
        {filtered.length > 0 && (
          <div className="mt-card" style={{ padding: 28, marginTop: 36 }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy size={18} color="#fff" />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0F172A',
                    fontFamily: 'Outfit, sans-serif',
                    margin: 0,
                  }}
                >
                  Top Rated Companies
                </h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                  Ranked by passenger satisfaction
                </p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <BarChart3 size={18} color="#94A3B8" />
              </div>
            </div>

            {/* Company rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TOP_COMPANIES.map((company) => {
                const rankColors: Record<number, { bg: string; text: string }> = {
                  1: { bg: '#FEF3C7', text: '#92400E' },
                  2: { bg: '#F1F5F9', text: '#475569' },
                  3: { bg: '#FEF3C7', text: '#92400E' },
                }
                const rankStyle = rankColors[company.rank] ?? { bg: '#F8FAFC', text: '#64748B' }

                return (
                  <div
                    key={company.rank}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: '#F8FAFC',
                      border: '1px solid #F1F5F9',
                      transition: 'background 0.15s, box-shadow 0.15s',
                      cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F1F5F9'
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Rank badge */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: rankStyle.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 800,
                        color: rankStyle.text,
                        flexShrink: 0,
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {company.rank === 1 ? '🥇' : company.rank === 2 ? '🥈' : company.rank === 3 ? '🥉' : `#${company.rank}`}
                    </div>

                    {/* Color dot */}
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: company.color,
                        flexShrink: 0,
                      }}
                    />

                    {/* Name */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#0F172A',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {company.name}
                    </span>

                    {/* Stars */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <StarDisplay rating={Math.round(company.avgRating)} size={13} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {company.avgRating.toFixed(1)}
                      </span>
                    </div>

                    {/* Review count */}
                    <span
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        background: '#E2E8F0',
                        padding: '3px 8px',
                        borderRadius: 99,
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      {company.reviewCount.toLocaleString()} reviews
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════ PAGINATION ══════════════════ */}
        {filtered.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 36,
              padding: '20px 0',
            }}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="mt-btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                fontSize: 14,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Page pills */}
              {[
                currentPage > 2 ? currentPage - 2 : null,
                currentPage > 1 ? currentPage - 1 : null,
                currentPage,
                currentPage < TOTAL_PAGES ? currentPage + 1 : null,
                currentPage < TOTAL_PAGES - 1 ? currentPage + 2 : null,
              ]
                .filter((p): p is number => p !== null && p >= 1 && p <= TOTAL_PAGES)
                .filter((p, idx, arr) => arr.indexOf(p) === idx)
                .slice(0, 5)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: p === currentPage ? '1.5px solid #16A34A' : '1.5px solid #E2E8F0',
                      background: p === currentPage ? '#16A34A' : '#FFFFFF',
                      color: p === currentPage ? '#FFFFFF' : '#64748B',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                      if (p !== currentPage) {
                        e.currentTarget.style.borderColor = '#16A34A'
                        e.currentTarget.style.color = '#16A34A'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (p !== currentPage) {
                        e.currentTarget.style.borderColor = '#E2E8F0'
                        e.currentTarget.style.color = '#64748B'
                      }
                    }}
                  >
                    {p}
                  </button>
                ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))}
              disabled={currentPage === TOTAL_PAGES}
              className="mt-btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                fontSize: 14,
                cursor: currentPage === TOTAL_PAGES ? 'not-allowed' : 'pointer',
                opacity: currentPage === TOTAL_PAGES ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Page indicator */}
        {filtered.length > 0 && (
          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: '#94A3B8',
              marginTop: 8,
              marginBottom: 40,
              fontWeight: 500,
            }}
          >
            Page {currentPage} of {TOTAL_PAGES} · Showing {filtered.length} of{' '}
            {ALL_REVIEWS.length} displayed reviews
          </p>
        )}
      </div>
    </div>
  )
}
