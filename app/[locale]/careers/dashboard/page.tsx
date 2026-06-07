'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Loader, User, Calendar, ExternalLink, Mail, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function CandidateDashboard() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          window.location.href = '/en/login?redirect=/en/careers/dashboard'
          return
        }
        setUser(session.user)

        // Fetch applications
        const { data, error } = await supabase
          .from('job_applications')
          .select('*, jobs(*, companies(name))')
          .eq('applicant_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setApplications(data || [])
      } catch (err) {
        console.error('Error fetching applications:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'offer_sent':
        return { bg: '#DCFCE7', text: '#15803D' }
      case 'rejected':
      case 'withdrawn':
        return { bg: '#FEE2E2', text: '#991B1B' }
      case 'interview_scheduled':
      case 'interview_completed':
        return { bg: '#FEF9C3', text: '#854D0E' }
      default:
        return { bg: '#EFF6FF', text: '#1D4ED8' }
    }
  }

  const formatStatus = (status: string) => {
    return status.toUpperCase().replace('_', ' ')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader className="spin" size={28} color="#16A34A" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Candidate Dashboard</h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>Track and manage your RoutePro applications</p>
          </div>
          <Link href="/en/careers" className="mt-btn-primary" style={{ textDecoration: 'none' }}>
            Find More Jobs
          </Link>
        </div>

        {/* User Card */}
        <div className="mt-card" style={{ padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 999, background: '#16A34A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{user?.email}</h3>
            <span style={{ fontSize: 12, color: '#64748B', display: 'block', marginTop: 2 }}>Applicant Workspace</span>
          </div>
        </div>

        {/* Active Applications */}
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Your Applications</h2>

        {applications.length === 0 ? (
          <div className="mt-card text-center" style={{ padding: '48px 24px' }}>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 16 }}>You haven't applied to any job listings yet.</p>
            <Link href="/en/careers" className="mt-btn-outline" style={{ textDecoration: 'none' }}>
              Explore Career Board
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {applications.map((app) => {
              const statusStyle = getStatusStyle(app.status)
              return (
                <div key={app.id} className="mt-card" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 10, background: statusStyle.bg, color: statusStyle.text, fontWeight: 700, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase' }}>
                        {formatStatus(app.status)}
                      </span>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 10, marginBottom: 4, fontFamily: 'Outfit, sans-serif' }}>
                        {app.jobs?.title}
                      </h3>
                      <p style={{ fontSize: 13, color: '#475569', fontWeight: 600, marginBottom: 12 }}>
                        {app.jobs?.companies?.name || 'RoutePro Internal Team'}
                      </p>
                      
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94A3B8' }}>
                        <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Location: {app.jobs?.location} ({app.jobs?.workplace_type})</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {app.status === 'interview_scheduled' && (
                        <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#713F12', textAlign: 'left', maxWidth: 300 }}>
                          <strong style={{ display: 'block', marginBottom: 4 }}>Upcoming Interview Scheduled</strong>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Calendar size={13} />
                            Check your email for calendar invite
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
