'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import CompanySidebar from '@/components/company/CompanySidebar'
import { Wallet, ShieldAlert, ArrowRight, Building, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [isApproved, setIsApproved] = useState(false)

  useEffect(() => {
    async function checkAuthAndCompany() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/en/login?redirect=/en/company/dashboard')
          return
        }
        setUser(session.user)

        // Fetch company where user is owner or team member
        // For owner
        let { data: companyData, error } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (!companyData) {
          // Check if team member
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

        if (!companyData) {
          // No company registered
          setIsApproved(false)
          setLoading(false)
          return
        }

        setCompany(companyData)

        // Check if APPROVED and dashboard enabled
        if (companyData.status === 'APPROVED' && companyData.dashboard_enabled) {
          setIsApproved(true)

          // Fetch company wallet details
          const { data: w } = await supabase
            .from('company_wallets')
            .select('*')
            .eq('company_id', companyData.id)
            .maybeSingle()
          setWallet(w)
        } else {
          setIsApproved(false)
        }
      } catch (err) {
        console.error('Error loading company layout session:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndCompany()
  }, [router])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div className="mt-card text-center" style={{ padding: 40, width: 320, background: '#FFFFFF' }}>
          <div className="skeleton" style={{ height: 28, width: '60%', margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ height: 16, width: '40%', margin: '0 auto 24px' }} />
          <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
        </div>
      </div>
    )
  }

  // Not verified or dashboard disabled gate
  if (!company || !isApproved) {
    return (
      <main style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div className="mt-card text-center fade-in" style={{ padding: 40, maxWidth: 480, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <ShieldAlert size={48} color="#F59E0B" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>Awaiting Approval</h2>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            {!company 
              ? 'You have not registered a company yet. Register to set up your partner workspace.' 
              : `Your company (${company.name}) is registered but the dashboard is currently deactivated or awaiting administrator compliance check.`
            }
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/en/companies/application-status" className="mt-btn-primary btn-press" style={{ textDecoration: 'none' }}>
              Check Application Status
            </Link>
            <Link href="/en" className="mt-btn-outline btn-press" style={{ textDecoration: 'none' }}>
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar - fixed left */}
      <CompanySidebar company={company} />

      {/* Main Content Area offset by sidebar width */}
      <div style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <header style={{
          height: 64,
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building size={18} color="#16A34A" />
            <strong style={{ fontSize: 14, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{company.name}</strong>
            <span style={{ fontSize: 10, background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>Verified</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Wallet balance quick display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 8 }}>
              <Wallet size={16} color="#64748B" />
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: '#64748B', display: 'block', lineHeight: 1 }}>Wallet Balance</span>
                <strong style={{ fontSize: 12, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                  ₦{wallet ? wallet.balance.toLocaleString() : '0'}
                </strong>
              </div>
            </div>

            <Link href="/en/dashboard/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic page container */}
        <div style={{ padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
