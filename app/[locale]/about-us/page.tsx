'use client';

import Link from 'next/link';
import {
  Shield,
  Zap,
  Heart,
  Globe,
  Users,
  MapPin,
  Bus,
  Train,
  Plane,
  Ship,
  Package,
  CheckCircle2,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
  Clock,
  Smartphone,
  Lock,
  Headphones,
  DollarSign,
  Target,
  Eye,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   INLINE STYLES — no Tailwind dependency
───────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  /* typography */
  fontOutfit: { fontFamily: "'Outfit', 'Inter', sans-serif" },

  /* ── HERO ───────────────────────────────── */
  hero: {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #064E3B 100%)',
    padding: '100px 24px 0',
    textAlign: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  heroTag: {
    display: 'inline-block',
    background: 'rgba(22,163,74,0.2)',
    border: '1px solid rgba(22,163,74,0.4)',
    color: '#4ADE80',
    borderRadius: '999px',
    padding: '6px 20px',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.03em',
    marginBottom: '24px',
  },
  heroH1: {
    fontSize: 'clamp(36px, 5.5vw, 56px)',
    fontWeight: 800,
    color: '#FFFFFF',
    lineHeight: 1.12,
    maxWidth: '820px',
    margin: '0 auto 20px',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.72)',
    maxWidth: '640px',
    margin: '0 auto 36px',
    lineHeight: 1.7,
  },
  heroBtns: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '64px',
  },
  btnGreen: {
    background: '#16A34A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  btnOutlineWhite: {
    background: 'transparent',
    color: '#fff',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: '10px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },

  /* floating stats strip */
  statsStrip: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '0 24px',
    position: 'relative',
    zIndex: 10,
    marginTop: '-8px',
    paddingBottom: '0',
  },
  statCard: {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px 32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    textAlign: 'center',
    minWidth: '160px',
    border: '1px solid rgba(255,255,255,0.9)',
  },
  statNum: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#0F172A',
    lineHeight: 1,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748B',
    fontWeight: 500,
  },
  statAccent: { color: '#16A34A' },

  /* ── SECTION WRAPPER ─────────────────────── */
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px',
  },
  sectionTag: {
    display: 'inline-block',
    background: 'rgba(22,163,74,0.1)',
    color: '#16A34A',
    borderRadius: '999px',
    padding: '5px 16px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 3.5vw, 40px)',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    marginBottom: '12px',
  },
  sectionSub: {
    fontSize: '17px',
    color: '#64748B',
    lineHeight: 1.7,
    maxWidth: '560px',
  },

  /* ── MISSION & VISION ────────────────────── */
  mvGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '48px',
  },
  mvCardGreen: {
    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    border: '1px solid #BBF7D0',
    borderRadius: '20px',
    padding: '36px',
    position: 'relative',
    overflow: 'hidden',
  },
  mvCardNavy: {
    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    border: '1px solid #BFDBFE',
    borderRadius: '20px',
    padding: '36px',
    position: 'relative',
    overflow: 'hidden',
  },
  mvIconWrapGreen: {
    width: '56px',
    height: '56px',
    background: '#16A34A',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  mvIconWrapNavy: {
    width: '56px',
    height: '56px',
    background: '#1E293B',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  mvTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: '12px',
  },
  mvText: {
    fontSize: '16px',
    color: '#334155',
    lineHeight: 1.75,
  },

  /* ── VALUES ──────────────────────────────── */
  valuesSection: {
    background: '#F8FAFC',
    borderTop: '1px solid #E2E8F0',
    borderBottom: '1px solid #E2E8F0',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '48px',
  },
  valueCard: {
    background: '#FFFFFF',
    borderRadius: '18px',
    padding: '28px 24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'center',
  },
  valueEmoji: { fontSize: '36px', marginBottom: '14px', display: 'block' },
  valueTitle: { fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' },
  valueText: { fontSize: '14px', color: '#64748B', lineHeight: 1.65 },

  /* ── HOW IT WORKS ───────────────────────── */
  howSection: { background: '#FFFFFF' },
  stepsWrapper: {
    display: 'flex',
    gap: '0',
    marginTop: '56px',
    overflowX: 'auto',
    paddingBottom: '16px',
    alignItems: 'flex-start',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    minWidth: '140px',
    flex: '1',
    position: 'relative',
  },
  stepConnector: {
    flex: 1,
    height: '2px',
    background: 'linear-gradient(90deg, #16A34A, #4ADE80)',
    marginTop: '32px',
    minWidth: '20px',
  },
  stepCircle: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #16A34A, #059669)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
    marginBottom: '12px',
    position: 'relative',
    zIndex: 2,
  },
  stepNum: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '22px',
    height: '22px',
    background: '#0F172A',
    color: '#fff',
    borderRadius: '50%',
    fontSize: '11px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: { fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' },
  stepDesc: { fontSize: '12px', color: '#64748B', lineHeight: 1.5, maxWidth: '120px' },

  /* ── WHY CHOOSE US ──────────────────────── */
  whySection: { background: '#F8FAFC', borderTop: '1px solid #E2E8F0' },
  whyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '48px',
  },
  whyCard: {
    background: '#FFFFFF',
    borderRadius: '18px',
    padding: '28px 24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  whyIconWrap: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  whyTitle: { fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' },
  whyText: { fontSize: '14px', color: '#64748B', lineHeight: 1.65 },

  /* ── PLATFORM STATS ─────────────────────── */
  statsBanner: {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    padding: '72px 24px',
  },
  statsBannerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '32px',
    textAlign: 'center',
  },
  bigStatWrap: {
    padding: '24px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  bigStatIcon: {
    width: '48px',
    height: '48px',
    background: 'rgba(22,163,74,0.15)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  bigStatNum: { fontSize: '42px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1, marginBottom: '6px' },
  bigStatLabel: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 },
  bigStatAccent: { color: '#4ADE80' },

  /* ── ROADMAP ─────────────────────────────── */
  roadmapSection: { background: '#FFFFFF' },
  roadmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '20px',
    marginTop: '48px',
  },
  roadmapCard: {
    borderRadius: '18px',
    padding: '28px 22px',
    border: '1px solid #E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  roadmapBadge: {
    display: 'inline-block',
    borderRadius: '999px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '16px',
  },
  roadmapIcon: { fontSize: '32px', marginBottom: '12px', display: 'block' },
  roadmapTitle: { fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' },
  roadmapDesc: { fontSize: '13px', color: '#64748B', lineHeight: 1.6 },

  /* ── CONTACT / CAREERS ──────────────────── */
  contactSection: { background: '#F8FAFC', borderTop: '1px solid #E2E8F0' },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginTop: '48px',
  },
  contactCard: {
    background: '#FFFFFF',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  contactCardTitle: { fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' },
  contactItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' },
  contactLabel: { fontSize: '14px', color: '#64748B', lineHeight: 1.5 },
  contactValue: { fontSize: '14px', fontWeight: 600, color: '#0F172A' },

  /* ── FINAL CTA ──────────────────────────── */
  ctaSection: {
    background: 'linear-gradient(135deg, #15803D 0%, #16A34A 50%, #059669 100%)',
    padding: '80px 24px',
    textAlign: 'center',
  },
  ctaH2: {
    fontSize: 'clamp(28px, 4vw, 44px)',
    fontWeight: 900,
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    marginBottom: '16px',
  },
  ctaSub: { fontSize: '18px', color: 'rgba(255,255,255,0.85)', maxWidth: '580px', margin: '0 auto 36px', lineHeight: 1.65 },
  ctaBtns: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' },
  btnWhiteFilled: {
    background: '#FFFFFF',
    color: '#15803D',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnOutlineWhite2: {
    background: 'transparent',
    color: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: '10px',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },

  /* divider */
  dividerDot: {
    width: '6px',
    height: '6px',
    background: '#16A34A',
    borderRadius: '50%',
    display: 'inline-block',
    margin: '0 6px',
    verticalAlign: 'middle',
  },
};

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const heroStats = [
  { num: 'Growing', label: 'Passenger Network' },
  { num: 'Onboarding', label: 'Transport Companies' },
  { num: 'Expanding', label: 'Cities & Routes' },
  { num: 'Modern', label: 'Booking Platform' },
];

const coreValues = [
  { emoji: '🛡️', title: 'Trust', text: 'Every company is verified. Every payment is secured. Every ticket is guaranteed.' },
  { emoji: '⚡', title: 'Safety', text: 'We only partner with licensed, insured operators that meet our strict safety standards.' },
  { emoji: '💡', title: 'Innovation', text: 'Digital tickets, real-time tracking, and smart booking — we build what travellers need.' },
  { emoji: '✅', title: 'Reliability', text: 'From booking to boarding, we ensure you get there on time, every time.' },
  { emoji: '🌍', title: 'Accessibility', text: 'Available in 6 languages. Works on any device. Simple enough for anyone.' },
];

const howSteps = [
  { icon: MapPin, title: 'Search Route', desc: 'Enter your origin and destination' },
  { icon: Bus, title: 'Choose Trip', desc: 'Pick from verified operators' },
  { icon: Users, title: 'Select Seat', desc: 'Choose your preferred seat' },
  { icon: Lock, title: 'Pay Securely', desc: 'Bank-grade encrypted payment' },
  { icon: Smartphone, title: 'Receive Ticket', desc: 'Instant QR code e-ticket' },
  { icon: CheckCircle2, title: 'Travel', desc: 'Board and enjoy your journey' },
];

const whyFeatures = [
  { icon: Shield, title: 'Verified Companies', text: 'All transport partners undergo strict CAC verification, fleet inspection, and document review.' },
  { icon: Lock, title: 'Secure Payments', text: 'Bank-grade encryption and Paystack-powered payments ensure your money is always safe.' },
  { icon: Smartphone, title: 'Digital Tickets', text: 'Instant QR-code e-tickets delivered to your phone. No printing required.' },
  { icon: Headphones, title: '24/7 Support', text: 'Our support team is always available via chat, phone, email, and WhatsApp.' },
  { icon: DollarSign, title: 'Transparent Pricing', text: 'No hidden fees. What you see is what you pay. Price comparison across operators.' },
];

const platformStats = [
  { icon: TrendingUp, num: 'Growing', label: 'Passenger Network' },
  { icon: MapPin, num: 'Expanding', label: 'Cities Connected' },
  { icon: Award, num: 'Onboarding', label: 'Verified Companies' },
  { icon: Star, num: 'Transparent', label: 'Platform Operations' },
];

const roadmapItems = [
  {
    emoji: '🚌',
    title: 'Bus Transportation',
    badge: '🚀 LAUNCHED',
    badgeColor: '#16A34A',
    badgeBg: '#DCFCE7',
    desc: 'Book intercity bus trips across Nigeria with verified operators.',
    cardBg: '#F0FDF4',
    border: '#BBF7D0',
  },
  {
    emoji: '🚢',
    title: 'Boat Transportation',
    badge: 'Q2 2025',
    badgeColor: '#1D4ED8',
    badgeBg: '#DBEAFE',
    desc: 'Ferry and boat services for coastal and riverine travel.',
    cardBg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    emoji: '🚂',
    title: 'Train Services',
    badge: 'Q4 2025',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    desc: 'Rail travel booking integration with NRC and private operators.',
    cardBg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    emoji: '✈️',
    title: 'Flight Integration',
    badge: '2026',
    badgeColor: '#7C3AED',
    badgeBg: '#EDE9FE',
    desc: 'Domestic and regional flight booking within the RoutePro platform.',
    cardBg: '#F5F3FF',
    border: '#DDD6FE',
  },
  {
    emoji: '📦',
    title: 'Logistics Services',
    badge: '2026',
    badgeColor: '#475569',
    badgeBg: '#F1F5F9',
    desc: 'Package delivery and freight services across all transport modes.',
    cardBg: '#F8FAFC',
    border: '#E2E8F0',
  },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function AboutUsPage() {
  return (
    <main style={{ ...styles.fontOutfit, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── GOOGLE FONTS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Outfit', 'Inter', sans-serif; }

        .hero-btn-green:hover { background: #15803D !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22,163,74,0.35); }
        .hero-btn-outline:hover { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.8) !important; }
        .value-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .why-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .contact-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.1) !important; }
        .roadmap-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important; }
        .cta-btn-white:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .cta-btn-outline:hover { background: rgba(255,255,255,0.12) !important; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 28px 72px rgba(0,0,0,0.22) !important; }

        @media (max-width: 768px) {
          .steps-wrapper { flex-direction: column !important; align-items: center !important; overflow-x: visible !important; }
          .step-connector { width: 2px !important; height: 32px !important; background: linear-gradient(180deg, #16A34A, #4ADE80) !important; flex: none !important; margin: 0 !important; }
          .hero-btns { flex-direction: column; align-items: center; }
          .stats-strip { flex-direction: column; align-items: center; }
        }
      `}</style>

      {/* ══════════════════════════════════════
          1. HERO
      ══════════════════════════════════════ */}
      <section style={styles.hero}>
        <div style={styles.heroTag}>🌍 Transforming African Transportation</div>
        <h1 style={{ ...styles.heroH1, fontFamily: "'Outfit', sans-serif" }}>
          Connecting Africa,<br />One Journey at a Time
        </h1>
        <p style={styles.heroSubtitle}>
          RoutePro connects passengers with verified transport operators through a secure, transparent,
          and reliable booking platform. We are making movement across Africa simple.
        </p>
        <div style={styles.heroBtns} className="hero-btns">
          <Link href="/book" style={styles.btnGreen} className="hero-btn-green">
            Book a Trip <ArrowRight size={18} />
          </Link>
          <Link href="/partner" style={styles.btnOutlineWhite} className="hero-btn-outline">
            Become a Partner <ArrowRight size={18} />
          </Link>
        </div>

        {/* decorative gradient glow */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '200px',
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
      </section>

      {/* ── FLOATING STATS ── */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #064E3B 100%)', paddingBottom: '56px' }}>
        <div style={styles.statsStrip} className="stats-strip">
          {heroStats.map((s) => (
            <div key={s.label} style={styles.statCard} className="stat-card">
              <div style={{ ...styles.statNum, ...styles.statAccent }}>{s.num}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          2. MISSION & VISION
      ══════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF' }}>
        <div style={styles.section}>
          <div style={{ textAlign: 'center', marginBottom: '0' }}>
            <span style={styles.sectionTag}>Who We Are</span>
            <h2 style={{ ...styles.sectionTitle, margin: '0 auto' }}>Mission &amp; Vision</h2>
            <p style={{ ...styles.sectionSub, margin: '12px auto 0' }}>
              We exist to simplify African mobility. Here is what drives us every single day.
            </p>
          </div>
          <div style={styles.mvGrid}>
            {/* Mission */}
            <div style={styles.mvCardGreen}>
              <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '120px', height: '120px', background: 'rgba(22,163,74,0.08)', borderRadius: '50%' }} />
              <div style={styles.mvIconWrapGreen}>
                <Target size={26} color="#fff" />
              </div>
              <h3 style={styles.mvTitle}>Our Mission</h3>
              <p style={styles.mvText}>
                To make transportation booking simple, transparent, and accessible for every African
                traveller — regardless of where they are.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 700, fontSize: '14px' }}>
                <CheckCircle2 size={16} /> Serving Africa since 2023
              </div>
            </div>

            {/* Vision */}
            <div style={styles.mvCardNavy}>
              <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '120px', height: '120px', background: 'rgba(30,41,59,0.06)', borderRadius: '50%' }} />
              <div style={styles.mvIconWrapNavy}>
                <Eye size={26} color="#fff" />
              </div>
              <h3 style={styles.mvTitle}>Our Vision</h3>
              <p style={styles.mvText}>
                To become Africa&apos;s leading transportation marketplace and mobility platform,
                serving 50 million passengers by 2030.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontWeight: 700, fontSize: '14px' }}>
                <TrendingUp size={16} /> 50M passengers by 2030
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. CORE VALUES
      ══════════════════════════════════════ */}
      <section style={styles.valuesSection}>
        <div style={styles.section}>
          <div style={{ textAlign: 'center' }}>
            <span style={styles.sectionTag}>What We Stand For</span>
            <h2 style={styles.sectionTitle}>Our Core Values</h2>
            <p style={{ ...styles.sectionSub, margin: '12px auto 0' }}>
              Five principles that guide every decision we make at RoutePro.
            </p>
          </div>
          <div style={styles.valuesGrid}>
            {coreValues.map((v) => (
              <div key={v.title} style={styles.valueCard} className="value-card">
                <span style={styles.valueEmoji}>{v.emoji}</span>
                <div style={styles.valueTitle}>{v.title}</div>
                <p style={styles.valueText}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. HOW IT WORKS
      ══════════════════════════════════════ */}
      <section style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
        <div style={styles.section}>
          <div style={{ textAlign: 'center' }}>
            <span style={styles.sectionTag}>The Process</span>
            <h2 style={styles.sectionTitle}>How RoutePro Works</h2>
            <p style={{ ...styles.sectionSub, margin: '12px auto 0' }}>
              Six simple steps from search to safe arrival.
            </p>
          </div>
          <div style={styles.stepsWrapper} className="steps-wrapper">
            {howSteps.map((step, i) => (
              <React.Fragment key={step.title}>
                <div style={styles.stepItem}>
                  <div style={{ position: 'relative' }}>
                    <div style={styles.stepCircle}>
                      <step.icon size={24} color="#fff" />
                    </div>
                    <div style={styles.stepNum}>{i + 1}</div>
                  </div>
                  <div style={styles.stepTitle}>{step.title}</div>
                  <p style={styles.stepDesc}>{step.desc}</p>
                </div>
                {i < howSteps.length - 1 && (
                  <div style={styles.stepConnector} className="step-connector" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. WHY CHOOSE US
      ══════════════════════════════════════ */}
      <section style={{ ...styles.whySection }}>
        <div style={styles.section}>
          <div style={{ textAlign: 'center' }}>
            <span style={styles.sectionTag}>Why RoutePro</span>
            <h2 style={styles.sectionTitle}>Built for African Travellers</h2>
            <p style={{ ...styles.sectionSub, margin: '12px auto 0' }}>
              Everything you need for a seamless journey — in one platform.
            </p>
          </div>
          <div style={styles.whyGrid}>
            {whyFeatures.map((f) => (
              <div key={f.title} style={styles.whyCard} className="why-card">
                <div style={styles.whyIconWrap}>
                  <f.icon size={22} color="#16A34A" />
                </div>
                <div style={styles.whyTitle}>{f.title}</div>
                <p style={styles.whyText}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. PLATFORM STATISTICS
      ══════════════════════════════════════ */}
      <section style={styles.statsBanner}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' }}>
          <span style={{ ...styles.sectionTag, background: 'rgba(22,163,74,0.2)', color: '#4ADE80' }}>By the Numbers</span>
          <h2 style={{ ...styles.sectionTitle, color: '#FFFFFF', margin: '8px 0' }}>Platform Statistics</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', lineHeight: 1.65 }}>
            Real numbers. Real impact. Real movement across Africa.
          </p>
        </div>
        <div style={styles.statsBannerInner}>
          {platformStats.map((s) => (
            <div key={s.label} style={styles.bigStatWrap}>
              <div style={styles.bigStatIcon}>
                <s.icon size={22} color="#4ADE80" />
              </div>
              <div style={{ ...styles.bigStatNum, ...styles.bigStatAccent }}>{s.num}</div>
              <div style={styles.bigStatLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          7. FUTURE ROADMAP
      ══════════════════════════════════════ */}
      <section style={styles.roadmapSection}>
        <div style={styles.section}>
          <div style={{ textAlign: 'center' }}>
            <span style={styles.sectionTag}>What&apos;s Coming</span>
            <h2 style={styles.sectionTitle}>Our Roadmap</h2>
            <p style={{ ...styles.sectionSub, margin: '12px auto 0' }}>
              RoutePro is expanding rapidly. Here is what we are building next.
            </p>
          </div>
          <div style={styles.roadmapGrid}>
            {roadmapItems.map((item) => (
              <div
                key={item.title}
                style={{ ...styles.roadmapCard, background: item.cardBg, borderColor: item.border }}
                className="roadmap-card"
              >
                <span style={{ ...styles.roadmapBadge, color: item.badgeColor, background: item.badgeBg }}>
                  {item.badge}
                </span>
                <span style={styles.roadmapIcon}>{item.emoji}</span>
                <div style={styles.roadmapTitle}>{item.title}</div>
                <p style={styles.roadmapDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          8. CONTACT & CAREERS
      ══════════════════════════════════════ */}
      <section style={styles.contactSection}>
        <div style={styles.section}>
          <div style={{ textAlign: 'center' }}>
            <span style={styles.sectionTag}>Get in Touch</span>
            <h2 style={styles.sectionTitle}>Contact &amp; Careers</h2>
            <p style={{ ...styles.sectionSub, margin: '12px auto 0' }}>
              We&apos;d love to hear from you — whether you are a traveller, partner, or future team member.
            </p>
          </div>
          <div style={styles.contactGrid}>

            {/* Contact */}
            <div style={styles.contactCard} className="contact-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', background: '#DCFCE7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Headphones size={20} color="#16A34A" />
                </div>
                <h3 style={styles.contactCardTitle}>Contact Us</h3>
              </div>
              <div style={styles.contactItem}>
                <Globe size={16} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={styles.contactLabel}>Email</div>
                  <div style={styles.contactValue}>hello@routepro.africa</div>
                </div>
              </div>
              <div style={styles.contactItem}>
                <Smartphone size={16} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={styles.contactLabel}>Phone / WhatsApp</div>
                  <div style={styles.contactValue}>+234 800 ROUTEPRO</div>
                </div>
              </div>
              <div style={styles.contactItem}>
                <MapPin size={16} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={styles.contactLabel}>Headquarters</div>
                  <div style={styles.contactValue}>Lagos, Nigeria 🇳🇬</div>
                </div>
              </div>
              <div style={styles.contactItem}>
                <Clock size={16} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={styles.contactLabel}>Support Hours</div>
                  <div style={styles.contactValue}>24/7 Always Available</div>
                </div>
              </div>
            </div>

            {/* Careers */}
            <div style={styles.contactCard} className="contact-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', background: '#EDE9FE', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color="#7C3AED" />
                </div>
                <h3 style={styles.contactCardTitle}>Careers</h3>
              </div>
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.7, marginBottom: '20px' }}>
                We are hiring! Join our passionate team building the future of African transportation.
                We value creativity, impact, and collaboration.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Product & Engineering', 'Operations & Logistics', 'Marketing & Growth', 'Customer Success'].map((role) => (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
                    <CheckCircle2 size={14} color="#16A34A" /> {role}
                  </div>
                ))}
              </div>
              <Link href="/careers" style={{ ...styles.btnGreen, marginTop: '24px', justifyContent: 'center' }} className="hero-btn-green">
                View Open Positions <ArrowRight size={16} />
              </Link>
            </div>

            {/* Partnerships */}
            <div style={styles.contactCard} className="contact-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', background: '#DBEAFE', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={20} color="#1D4ED8" />
                </div>
                <h3 style={styles.contactCardTitle}>Partnerships</h3>
              </div>
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: 1.7, marginBottom: '20px' }}>
                Partner with RoutePro to expand your reach across Nigeria and beyond. List your fleet,
                fill your seats, and grow your revenue with our platform.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {['Expand your customer base', 'Digital ticketing & management', 'Revenue analytics dashboard', 'Dedicated partner support'].map((b) => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
                    <CheckCircle2 size={14} color="#16A34A" /> {b}
                  </div>
                ))}
              </div>
              <Link href="/partner" style={{ ...styles.btnOutlineWhite, color: '#1E293B', borderColor: '#CBD5E1', justifyContent: 'center' }} className="hero-btn-outline">
                Apply Now <ArrowRight size={16} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          9. FINAL CTA
      ══════════════════════════════════════ */}
      <section style={styles.ctaSection}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: '-60px', left: '10%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '8%', width: '160px', height: '160px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', zIndex: 0 }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', padding: '6px 16px', marginBottom: '20px' }}>
            <Star size={14} color="#FDE68A" fill="#FDE68A" />
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Trusted by 820,000+ passengers</span>
          </div>
          <h2 style={styles.ctaH2}>Ready to Travel Smarter?</h2>
          <p style={styles.ctaSub}>
            Join over 820,000 passengers who trust RoutePro for safe, reliable, and affordable journeys
            across Africa.
          </p>
          <div style={styles.ctaBtns}>
            <Link href="/book" style={styles.btnWhiteFilled} className="cta-btn-white">
              Book a Trip <ArrowRight size={18} />
            </Link>
            <Link href="/about-us" style={styles.btnOutlineWhite2} className="cta-btn-outline">
              Learn More <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

/* need React in scope for React.Fragment in JSX */
import React from 'react';
