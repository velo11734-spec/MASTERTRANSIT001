'use client'

import { BarChart3, TrendingUp, DollarSign, Target } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Performance Analytics</h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>Analyze listing impressions, track trip ticket margins, and review general metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="mt-card" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Impressions</span>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>1,420 views</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontSize: 11, marginTop: 8 }}>
            <TrendingUp size={14} /> <span>+12.4% vs last week</span>
          </div>
        </div>

        <div className="mt-card" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Gross Revenue</span>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>₦0</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 11, marginTop: 8 }}>
            <DollarSign size={14} /> <span>Awaiting initial sales runs</span>
          </div>
        </div>

        <div className="mt-card" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Conversion Rate</span>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>0%</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 11, marginTop: 8 }}>
            <Target size={14} /> <span>Market median is 2.8%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
