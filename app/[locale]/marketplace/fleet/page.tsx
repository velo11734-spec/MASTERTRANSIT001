'use client'

import Link from 'next/link'
import { ArrowLeft, Truck, Settings, ShieldAlert, BarChart3, Mail } from 'lucide-react'

export default function FleetSolutionsPage() {
  const features = [
    { icon: Settings, title: 'Route Optimization Engine', desc: 'Optimize fuel usage, calculate ETA and dispatcher schedules automatically using historical traffic datasets.' },
    { icon: ShieldAlert, title: 'Driver Telematics & Safety', desc: 'Monitor driver speed, brake telemetry patterns and receive real-time updates to minimize risk profiles.' },
    { icon: BarChart3, title: 'B2B Subscriptions & Billing', desc: 'Consolidate multiple company departments, generate monthly corporate invoices and manage travel stipends.' }
  ]

  const packages = [
    { name: 'Starter Logistics', price: '₦45,000', period: 'month', desc: 'Best for operators managing up to 5 commercial vans.', features: ['Up to 5 vehicles', 'GPS Tracking', 'Fuel logging system', 'Email customer support'] },
    { name: 'Enterprise Fleet', price: '₦120,000', period: 'month', desc: 'Complete suite for luxury coach companies and large fleets.', features: ['Unlimited vehicles', 'Advanced driver telematics', 'Route optimization APIs', '24/7 dedicated account manager', 'Platform API access'] }
  ]

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href="/en/marketplace" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Mobility Marketplace
        </Link>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '4px 12px', borderRadius: 999 }}>
            B2B Enterprise Portal
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginTop: 14 }}>
            RoutePro Fleet Solutions
          </h1>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 10, maxWidth: 580, margin: '10px auto 0', lineHeight: 1.6 }}>
            Modern fleet tracking, safety metrics, and route management APIs built for African transportation and logistics providers.
          </p>
        </div>

        {/* Features Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 48 }}>
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="mt-card" style={{ padding: 20, border: '1px solid #F1F5F9' }}>
                <div style={{ width: 36, height: 36, background: '#EDE9FE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={18} color="#7C3AED" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Pricing Cards */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', textAlign: 'center', marginBottom: 24, fontFamily: 'Outfit, sans-serif' }}>
            Subscription Packages
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {packages.map((pkg) => (
              <div key={pkg.name} className="mt-card" style={{ padding: 28, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{pkg.name}</h3>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>{pkg.desc}</p>
                
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A' }}>{pkg.price}</span>
                  <span style={{ fontSize: 12, color: '#64748B' }}> / {pkg.period}</span>
                </div>

                <div style={{ flexGrow: 1, marginBottom: 24 }}>
                  <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                    {pkg.features.map((feat) => (
                      <li key={feat} style={{ fontSize: 13, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#7C3AED' }}>✓</span> {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href="/en/partner" className="mt-btn-primary" style={{ background: '#7C3AED', border: 'none', textAlign: 'center', width: '100%' }}>
                  Submit Inquiry
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
