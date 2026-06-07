'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Building,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function ApplicationStatusPage() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchApplications(session.user.id)
      } else {
        setAuthLoading(false)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchApplications(session.user.id)
      } else {
        setUser(null)
        setApplications([])
        setAuthLoading(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchApplications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (err) {
      console.error('Failed to load company applications:', err)
    } finally {
      setAuthLoading(false)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' }
      case 'REJECTED': return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' }
      case 'UNDER_REVIEW':
      case 'INFO_REQUESTED': return { bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' }
      default: return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }
    }
  }

  // Stepper helper
  const getStepperIndex = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 5
      case 'UNDER_REVIEW': return 2
      case 'REJECTED': return 1
      default: return 1 // PENDING
    }
  }

  const steps = [
    { label: 'Application Submitted', desc: 'Securely recorded in RoutePro databases.' },
    { label: 'Document Review', desc: 'Our compliance officers verify CAC & License records.' },
    { label: 'Business Verification', desc: 'Validating bank structures and trade credentials.' },
    { label: 'System Provisioning', desc: 'Preparing localized database instances.' },
    { label: 'Dashboard Access Granted', desc: 'Onboarding complete! Access your brand new operating system.' }
  ]

  if (authLoading || loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#F8FAFC', padding: '64px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="mt-card text-center" style={{ padding: 40, background: '#FFFFFF', maxWidth: 450, width: '100%' }}>
          <div className="skeleton" style={{ height: 28, width: '70%', margin: '0 auto 12px' }} />
          <div className="skeleton" style={{ height: 16, width: '50%', margin: '0 auto 24px' }} />
          <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', padding: '64px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: '#16A34A', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <Building size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Application Status Hub</h1>
            <p style={{ fontSize: 13, color: '#64748B' }}>Track your RoutePro partner onboarding progress</p>
          </div>
        </div>

        {!user ? (
          <div className="mt-card text-center" style={{ padding: 40, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <AlertCircle size={44} color="#F59E0B" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Not Logged In</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Please login to review your company submission status.</p>
            <Link href="/en/login" className="mt-btn-primary btn-press" style={{ textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-card text-center" style={{ padding: 40, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
            <AlertCircle size={44} color="#64748B" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No Applications Found</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>You have not submitted any business partner registrations yet.</p>
            <Link href="/en/companies/join" className="mt-btn-primary btn-press" style={{ textDecoration: 'none' }}>
              Submit Application
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {applications.map(app => {
              const statusStyle = getStatusColor(app.status)
              const activeIndex = getStepperIndex(app.status)

              return (
                <div key={app.id} className="mt-card fade-in" style={{ padding: 28, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
                  {/* Top Bar info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #F1F5F9', paddingBottom: 16, marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{app.name}</h3>
                      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>ID: {app.id} • Registered: {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1.5px solid ${statusStyle.border}`,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 999
                    }}>
                      {app.status}
                    </span>
                  </div>

                  {/* Notification Alert if pending */}
                  {app.status?.toUpperCase() === 'PENDING' && (
                    <div style={{ background: '#EFF6FF', color: '#1D4ED8', padding: 14, borderRadius: 10, fontSize: 12, display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 24 }}>
                      <Clock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ display: 'block', marginBottom: 2 }}>Awaiting Compliance Review</strong>
                        Our verification team routinely processes new submissions within 24 to 48 business hours. We will email you if additional documentation is required.
                      </div>
                    </div>
                  )}

                  {/* Success Alert if APPROVED */}
                  {app.status?.toUpperCase() === 'APPROVED' && (
                    <div style={{ background: '#DCFCE7', color: '#15803D', padding: 16, borderRadius: 10, fontSize: 13, display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 24 }}>
                      <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ display: 'block', marginBottom: 4 }}>Congratulations! Your application is approved!</strong>
                        Your workspace is provisioned. Click the button below to load your specialized role-based company operating dashboard.
                        <div style={{ marginTop: 12 }}>
                          <Link href="/en/company/dashboard" className="mt-btn-primary btn-press" style={{ textDecoration: 'none', background: '#15803D', fontSize: 12, padding: '8px 16px', borderRadius: 6 }}>
                            <LayoutDashboard size={14} /> Access Company OS
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visual Progress Stepper */}
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Onboarding Pipeline</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {steps.map((step, idx) => {
                        const isCompleted = activeIndex > idx
                        const isCurrent = activeIndex === idx + 1
                        const isPending = activeIndex <= idx

                        return (
                          <div key={idx} style={{ display: 'flex', gap: 16 }}>
                            {/* Circle dot and line */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: 999,
                                background: isCompleted ? '#16A34A' : isCurrent ? '#FEF9C3' : '#F1F5F9',
                                border: `2px solid ${isCompleted ? '#16A34A' : isCurrent ? '#F59E0B' : '#CBD5E1'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isCompleted ? '#FFFFFF' : isCurrent ? '#D97706' : '#94A3B8',
                                fontSize: 11,
                                fontWeight: 700,
                                zIndex: 2
                              }}>
                                {isCompleted ? '✓' : idx + 1}
                              </div>
                              {idx < steps.length - 1 && (
                                <div style={{ width: 2, flex: 1, background: isCompleted ? '#16A34A' : '#E2E8F0', margin: '4px 0 -24px' }} />
                              )}
                            </div>

                            {/* Label content */}
                            <div style={{ paddingBottom: idx < steps.length - 1 ? 12 : 0 }}>
                              <strong style={{ fontSize: 13, color: isPending ? '#64748B' : '#0F172A', display: 'block' }}>{step.label}</strong>
                              <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginTop: 2 }}>{step.desc}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* FAQ links */}
                  <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 28, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HelpCircle size={14} color="#64748B" />
                      <span style={{ fontSize: 11, color: '#64748B' }}>Need help with verification?</span>
                    </div>
                    <Link href="/en/help-center" style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
                      Contact Support Center →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
