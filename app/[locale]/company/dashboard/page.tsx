'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  TrendingUp,
  Users,
  Wallet,
  Building,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Clock,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'

export default function CompanyDashboardOverview() {
  const [company, setCompany] = useState<any>(null)
  const [stats, setStats] = useState({
    fleetCount: 0,
    leadsCount: 0,
    bookingsCount: 0,
    walletBalance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Fetch company
        let { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (!companyData) {
          // Check team member
          const { data: memberData } = await supabase
            .from('company_team_members')
            .select('company_id')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .maybeSingle()

          if (memberData?.company_id) {
            const { data: comp } = await supabase
              .from('companies')
              .select('*')
              .eq('id', memberData.company_id)
              .maybeSingle()
            companyData = comp
          }
        }

        if (companyData) {
          setCompany(companyData)

          // Fetch fleet vehicles count
          const { count: fleetCount } = await supabase
            .from('fleet_vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyData.id)

          // Fetch leads count
          const { count: leadsCount } = await supabase
            .from('vehicle_leads')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyData.id)

          // Fetch wallet balance
          const { data: walletData } = await supabase
            .from('company_wallets')
            .select('balance')
            .eq('company_id', companyData.id)
            .maybeSingle()

          // Fetch bookings count (joining trips to get company's bookings)
          const { count: bookingsCount } = await supabase
            .from('bookings')
            .select('id, trips!inner(company_id)', { count: 'exact', head: true })
            .eq('trips.company_id', companyData.id)

          setStats({
            fleetCount: fleetCount || 0,
            leadsCount: leadsCount || 0,
            bookingsCount: bookingsCount || 0,
            walletBalance: walletData?.balance || 0
          })
        }
      } catch (err) {
        console.error('Failed to load company stats overview:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />)}
        </div>
      </div>
    )
  }

  const roles = company?.business_roles || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      {/* Welcome Header */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 950, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
          Welcome back, {company?.name}!
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Here is your company operational performance snapshot for today.
        </p>

        {/* Roles Badge Line */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {roles.map((r: string) => (
            <span key={r} style={{ fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: 999 }}>
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <div className="mt-card card-hover" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Available Funds</span>
            <div style={{ padding: 6, background: '#DCFCE7', borderRadius: 8, color: '#16A34A' }}>
              <Wallet size={16} />
            </div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
            ₦{stats.walletBalance.toLocaleString()}
          </h2>
          <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>Cleared to payout</span>
        </div>

        {roles.includes('Transport Operator') && (
          <div className="mt-card card-hover" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Fleet Vehicles</span>
              <div style={{ padding: 6, background: '#EFF6FF', borderRadius: 8, color: '#1D4ED8' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              {stats.fleetCount}
            </h2>
            <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>Registered in fleet</span>
          </div>
        )}

        {roles.includes('Vehicle Dealer') && (
          <div className="mt-card card-hover" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Sales Leads</span>
              <div style={{ padding: 6, background: '#FEF3C7', borderRadius: 8, color: '#D97706' }}>
                <Users size={16} />
              </div>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              {stats.leadsCount}
            </h2>
            <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>Interested prospective buyers</span>
          </div>
        )}

        <div className="mt-card card-hover" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Verification Status</span>
            <div style={{ padding: 6, background: '#DCFCE7', borderRadius: 8, color: '#16A34A' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#15803D', fontFamily: 'Outfit, sans-serif' }}>
            Active & Verified
          </h2>
          <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>Compliance pass</span>
        </div>
      </div>

      {/* Two Column Layout for Actions & Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Main interactive area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="mt-card" style={{ padding: 28, background: '#FFFFFF', borderRadius: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>
              Specialized Operations Panels
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {roles.includes('Transport Operator') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: 16, borderRadius: 8 }}>
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>Transport Operations</strong>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Add vehicles, configure route lines and dispatch scheduled trips.</span>
                  </div>
                  <Link href="/en/company/fleet" className="mt-btn-outline btn-press" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: 12 }}>
                    Open Fleet Hub
                  </Link>
                </div>
              )}

              {roles.includes('Vehicle Dealer') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: 16, borderRadius: 8 }}>
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>Marketplace Dealership</strong>
                    <span style={{ fontSize: 11, color: '#64748B' }}>List cars, trucks or buses for sale and negotiate buyer leads.</span>
                  </div>
                  <Link href="/en/company/inventory" className="mt-btn-outline btn-press" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: 12 }}>
                    Open Showroom
                  </Link>
                </div>
              )}

              {roles.includes('Rental Provider') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: 16, borderRadius: 8 }}>
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>Vehicle Rental System</strong>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Manage your rental catalog, configure daily hire pricing, and lock deposit escrows.</span>
                  </div>
                  <Link href="/en/company/rentals" className="mt-btn-outline btn-press" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: 12 }}>
                    Open Rentals Hub
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar help / resources */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="mt-card" style={{ padding: 24, background: '#FFFFFF', borderRadius: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>Quick Resources</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/en/help-center" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none', display: 'block' }}>
                • Partner Integration Guide
              </Link>
              <Link href="/en/help-center" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none', display: 'block' }}>
                • Understanding payouts and fees
              </Link>
              <Link href="/en/help-center" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none', display: 'block' }}>
                • Dispatching routes instructions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
