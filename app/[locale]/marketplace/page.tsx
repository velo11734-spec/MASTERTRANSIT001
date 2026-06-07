'use client'

import Link from 'next/link'
import { Car, Key, ShieldCheck, ArrowRight, Truck } from 'lucide-react'

export default function MarketplaceHubPage() {
  const modules = [
    {
      title: 'Vehicle Marketplace',
      desc: 'Buy or sell buses, luxury coaches, airport shuttles, and minivans. Connect directly with verified dealers and logistics companies.',
      href: '/en/marketplace/vehicles',
      icon: Car,
      color: '#16A34A',
      bg: '#DCFCE7',
      action: 'Browse Inventory'
    },
    {
      title: 'Vehicle Rentals',
      desc: 'Rent vehicles for commercial transit, corporate transport, group events, or logistics operations. Premium fleets available with verified drivers.',
      href: '/en/marketplace/rentals',
      icon: Key,
      color: '#2563EB',
      bg: '#DBEAFE',
      action: 'Book a Rental'
    },
    {
      title: 'Fleet Solutions',
      desc: 'Corporate subscription plans, route management tracking software, fuel optimization, and driver telemetry suites for transport companies.',
      href: '/en/marketplace/fleet',
      icon: Truck,
      color: '#7C3AED',
      bg: '#EDE9FE',
      action: 'Explore Fleet Plans'
    }
  ]

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mobility Ecosystem
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginTop: 16 }}>
            RoutePro Mobility Marketplace
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', marginTop: 12, maxWidth: 600, margin: '12px auto 0' }}>
            Expand your transportation network, manage logistics assets, and tap into global B2B corporate mobility options.
          </p>
        </div>

        {/* Modules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <div key={m.title} className="mt-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 28, transition: 'all 0.2s', border: '1px solid #E2E8F0' }}>
                <div style={{ width: 48, height: 48, background: m.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={24} color={m.color} />
                </div>
                
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginBottom: 12 }}>
                  {m.title}
                </h3>
                
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, flexGrow: 1, marginBottom: 24 }}>
                  {m.desc}
                </p>
                
                <Link href={m.href} className="mt-btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: m.color, border: 'none', width: '100%' }}>
                  {m.action} <ArrowRight size={16} />
                </Link>
              </div>
            )
          })}
        </div>

        {/* trust notice */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48, color: '#64748B', fontSize: 13 }}>
          <ShieldCheck size={16} color="#16A34A" />
          <span>Every listings dealer, rental fleet and transaction is verified by RoutePro Admin.</span>
        </div>

      </div>
    </div>
  )
}
