'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Star,
  MapPin,
  Bus,
  Shield,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Route,
  CheckCircle2,
  Building2,
  Award,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  city: string;
  state: string;
  logo_url?: string | null;
  rating: number;
  status: string;
  cac_number?: string | null;
  created_at?: string | null;
  // Extended / fallback fields
  reviews?: number;
  routes?: number;
  estYear?: number;
}

// ─── Fallback Data ────────────────────────────────────────────────────────────
// Removed mock fallback companies

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const LOGO_COLORS = [
  '#16A34A', '#0369A1', '#7C3AED', '#B45309',
  '#DC2626', '#0891B2', '#059669', '#9333EA',
];

function getLogoColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={14}
      style={{
        fill: i < Math.round(rating) ? '#F59E0B' : 'none',
        color: i < Math.round(rating) ? '#F59E0B' : '#CBD5E1',
        flexShrink: 0,
      }}
    />
  ));
}

function getEstYear(company: Company): number {
  if (company.estYear) return company.estYear;
  if (company.created_at) return new Date(company.created_at).getFullYear();
  return 2020;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="mt-card"
      style={{
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: '#E2E8F0', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 20, width: '60%', background: '#E2E8F0', borderRadius: 6 }} />
          <div style={{ height: 14, width: '40%', background: '#E2E8F0', borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ height: 14, width: '80%', background: '#E2E8F0', borderRadius: 6 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ height: 32, flex: 1, background: '#E2E8F0', borderRadius: 8 }} />
        <div style={{ height: 32, flex: 1, background: '#E2E8F0', borderRadius: 8 }} />
        <div style={{ height: 32, flex: 1, background: '#E2E8F0', borderRadius: 8 }} />
      </div>
      <div style={{ height: 40, background: '#E2E8F0', borderRadius: 8 }} />
    </div>
  );
}

// ─── Company Card ─────────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
  const [hovered, setHovered] = useState(false);
  const initials = getInitials(company.name);
  const logoColor = getLogoColor(company.id);
  const estYear = getEstYear(company);
  const reviews = company.reviews ?? 0;
  const routes = company.routes ?? 0;

  return (
    <div
      className="mt-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        cursor: 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 48px -8px rgba(22, 163, 74, 0.18), 0 0 0 2px #16A34A'
          : '0 2px 12px rgba(0,0,0,0.06)',
        border: hovered ? '2px solid #16A34A' : '2px solid transparent',
        borderRadius: 16,
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative top stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${logoColor}, #16A34A)`,
          borderRadius: '16px 16px 0 0',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Header: Logo + Verified badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Logo */}
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '2px solid #F1F5F9' }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${logoColor}22, ${logoColor}44)`,
                border: `2px solid ${logoColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 20, color: logoColor, letterSpacing: '-0.5px' }}>
                {initials}
              </span>
            </div>
          )}

          {/* Name & Location */}
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
              {company.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
              <MapPin size={13} color="#64748B" />
              <span style={{ fontSize: 13, color: '#64748B' }}>{company.city}, {company.state}</span>
            </div>
          </div>
        </div>

        {/* Verified badge */}
        <div
          className="badge-verified"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#DCFCE7',
            color: '#15803D',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: '1px solid #BBF7D0',
          }}
        >
          <Shield size={11} style={{ fill: '#15803D' }} />
          Verified
        </div>
      </div>

      {/* Rating row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 2 }}>{renderStars(company.rating)}</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{company.rating.toFixed(1)}</span>
        <span style={{ fontSize: 13, color: '#64748B' }}>({reviews.toLocaleString()} reviews)</span>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {[
          { icon: <Route size={14} color="#16A34A" />, label: `${routes} Routes` },
          { icon: <Award size={14} color="#16A34A" />, label: `Est. ${estYear}` },
          { icon: <Users size={14} color="#16A34A" />, label: `${reviews.toLocaleString()} Reviews` },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 8,
              padding: '7px 10px',
            }}
          >
            {stat.icon}
            <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={`/companies/${company.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '11px 0',
          borderRadius: 10,
          background: hovered ? '#16A34A' : 'transparent',
          color: hovered ? '#fff' : '#16A34A',
          border: '1.5px solid #16A34A',
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
        }}
      >
        View Company
        <ChevronRight size={15} />
      </Link>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'rating' | 'popular' | 'newest'>('rating');
  const [searchFocused, setSearchFocused] = useState(false);

  // Fetch companies
  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, city, state, logo_url, rating, status, cac_number, created_at')
          .eq('status', 'verified')
          .order('rating', { ascending: false });

        if (error || !data) {
          setCompanies([]);
        } else {
          setCompanies(data as Company[]);
        }
      } catch {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  // Derived filtered list
  const filtered = companies
    .filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (locationFilter !== 'all' && c.city.toLowerCase() !== locationFilter.toLowerCase()) return false;
      if (ratingFilter === '5' && c.rating < 4.95) return false;
      if (ratingFilter === '4' && c.rating < 4.0) return false;
      if (ratingFilter === '3' && c.rating < 3.0) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'rating') return b.rating - a.rating;
      if (sortOrder === 'popular') return (b.reviews ?? 0) - (a.reviews ?? 0);
      if (sortOrder === 'newest') return getEstYear(b) - getEstYear(a);
      return 0;
    });

  // Count active filters
  const activeFilters = [
    locationFilter !== 'all',
    ratingFilter !== 'all',
    search.trim() !== '',
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch('');
    setLocationFilter('all');
    setRatingFilter('all');
    setSortOrder('rating');
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const selectStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    background: '#fff',
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    paddingRight: 36,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    minWidth: 0,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Inline keyframes ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .company-grid { animation: fadeInUp 0.4s ease both; }
        .stat-chip:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(22,163,74,0.15); }
      `}</style>

      {/* ════════════════════════════════════════
          1. HERO SECTION
      ════════════════════════════════════════ */}
      <section
        style={{
          background: '#fff',
          borderBottom: '1px solid #E2E8F0',
          paddingTop: 72,
          paddingBottom: 64,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle dot pattern background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, #E2E8F0 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
        {/* Green radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 600,
            height: 300,
            background: 'radial-gradient(ellipse, rgba(22,163,74,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#DCFCE7',
              color: '#15803D',
              padding: '6px 16px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid #BBF7D0',
              marginBottom: 20,
              animation: 'scaleIn 0.4s ease both',
            }}
          >
            <CheckCircle2 size={14} style={{ fill: '#15803D', color: '#fff' }} />
            All Verified
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 46px)',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 16px',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              animation: 'fadeInUp 0.45s 0.05s ease both',
            }}
          >
            Verified Transport{' '}
            <span style={{ color: '#16A34A' }}>Operators</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 17,
              color: '#64748B',
              margin: '0 0 36px',
              lineHeight: 1.65,
              animation: 'fadeInUp 0.45s 0.1s ease both',
            }}
          >
            Travel with trusted and certified transportation companies across Nigeria.
          </p>

          {/* Stat chips */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
              animation: 'fadeInUp 0.45s 0.15s ease both',
            }}
          >
            {[
              { icon: <Building2 size={15} />, label: '127+ Companies' },
              { icon: <Route size={15} />,     label: '2,400 Routes' },
              { icon: <Bus size={15} />,       label: '20K Daily Trips' },
              { icon: <Users size={15} />,     label: '2.1M Passengers' },
            ].map((chip, i) => (
              <div
                key={i}
                className="stat-chip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: '#F0FDF4',
                  color: '#15803D',
                  border: '1.5px solid #BBF7D0',
                  borderRadius: 24,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  cursor: 'default',
                }}
              >
                {chip.icon}
                {chip.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CONTENT WRAPPER
      ════════════════════════════════════════ */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ════════════════════════════════════════
            2. FILTER & SORT BAR
        ════════════════════════════════════════ */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            padding: '20px 20px',
            marginBottom: 32,
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}
        >
          {/* Row 1: Search + active filter badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
              <Search
                size={16}
                color={searchFocused ? '#16A34A' : '#64748B'}
                style={{
                  position: 'absolute',
                  left: 13,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  transition: 'color 0.2s',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search transport companies…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: 10,
                  border: searchFocused ? '1.5px solid #16A34A' : '1.5px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Active filter badge */}
            {activeFilters > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Filter size={12} />
                {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
              </div>
            )}

            {/* Clear filters */}
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16A34A',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: 8,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Row 2: Dropdowns */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              <SlidersHorizontal size={14} />
              Filters:
            </div>

            {/* Location */}
            <div style={{ position: 'relative' }}>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Locations</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Kano">Kano</option>
                <option value="PH">Port Harcourt (PH)</option>
                <option value="Ibadan">Ibadan</option>
                <option value="Enugu">Enugu</option>
              </select>
            </div>

            {/* Rating */}
            <div style={{ position: 'relative' }}>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Ratings</option>
                <option value="5">5★ Only</option>
                <option value="4">4★ and above</option>
                <option value="3">3★ and above</option>
              </select>
            </div>

            {/* Sort */}
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'rating' | 'popular' | 'newest')}
                style={{ ...selectStyle, borderColor: '#16A34A', color: '#16A34A', background: '#F0FDF4' }}
              >
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={15} color="#16A34A" />
            <span style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
              {filtered.length === 0
                ? 'No companies found'
                : `Showing ${filtered.length} verified compan${filtered.length === 1 ? 'y' : 'ies'}`}
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════
            3/4. COMPANY CARDS GRID / LOADING / EMPTY
        ════════════════════════════════════════ */}

        {/* Loading skeletons */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
              gap: 20,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '72px 24px',
              background: '#fff',
              borderRadius: 20,
              border: '1.5px solid #E2E8F0',
              animation: 'scaleIn 0.3s ease both',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Building2 size={32} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
              No companies match your search
            </h3>
            <p style={{ color: '#64748B', fontSize: 15, margin: '0 0 24px' }}>
              Try adjusting your filters or search term.
            </p>
            <button
              onClick={clearFilters}
              style={{
                background: '#16A34A',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Company grid */}
        {!loading && filtered.length > 0 && (
          <div
            className="company-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
              gap: 20,
            }}
          >
            {filtered.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════
            7. BECOME A PARTNER CTA
        ════════════════════════════════════════ */}
        <section
          style={{
            marginTop: 64,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #15803D 0%, #16A34A 45%, #22C55E 100%)',
            padding: '56px 40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circles */}
          {[
            { size: 220, top: -60, right: -60, opacity: 0.15 },
            { size: 140, bottom: -40, left: 40, opacity: 0.1 },
            { size: 80,  top: 40,  left: -20, opacity: 0.12 },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: c.size,
                height: c.size,
                borderRadius: '50%',
                background: '#fff',
                opacity: c.opacity,
                top: c.top,
                right: (c as any).right,
                bottom: (c as any).bottom,
                left: (c as any).left,
                pointerEvents: 'none',
              }}
            />
          ))}

          <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            {/* Icon */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.2)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <Bus size={28} color="#fff" />
            </div>

            <h2
              style={{
                fontSize: 'clamp(22px, 4vw, 32px)',
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 12px',
                letterSpacing: '-0.5px',
              }}
            >
              Are You a Transport Operator?
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.88)',
                margin: '0 0 32px',
                lineHeight: 1.65,
              }}
            >
              Join 127+ verified companies on RoutePro. Reach millions of passengers across Nigeria.
            </p>

            {/* Requirements */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'center',
                marginBottom: 36,
              }}
            >
              {[
                'CAC Registration',
                'Fleet Insurance',
                'Government License',
                'Safety Standards',
              ].map((req) => (
                <div
                  key={req}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 20,
                    padding: '6px 14px',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={13} style={{ fill: 'rgba(255,255,255,0.3)', color: '#fff' }} />
                  {req}
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href="/apply"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                color: '#16A34A',
                borderRadius: 12,
                padding: '14px 32px',
                fontWeight: 800,
                fontSize: 16,
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
              }}
            >
              Apply to Join
              <ChevronRight size={18} />
            </Link>
          </div>
        </section>

      </div>{/* /content wrapper */}
    </div>
  );
}
