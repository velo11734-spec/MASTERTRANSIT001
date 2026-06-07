'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Send, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function JobApplyPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params?.jobId as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form fields
  const [cvUrl, setCvUrl] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push(`/en/login?redirect=/en/careers/apply/${jobId}`)
          return
        }
        setUser(session.user)

        const { data, error: jobErr } = await supabase
          .from('jobs')
          .select('*, companies(name)')
          .eq('id', jobId)
          .single()

        if (jobErr) throw jobErr
        setJob(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load job details')
      } finally {
        setLoading(false)
      }
    }
    if (jobId) init()
  }, [jobId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const timeline = [
        { status: 'applied', label: 'Application Submitted', date: new Date().toISOString() }
      ]

      const { error: appErr } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          cv_url: cvUrl,
          cover_letter: coverLetter,
          status: 'applied',
          timeline: timeline
        })

      if (appErr) throw appErr
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader className="spin" size={28} color="#16A34A" />
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="mt-card text-center" style={{ maxWidth: 460, padding: 40 }}>
          <CheckCircle size={48} color="#16A34A" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>Application Submitted!</h2>
          <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Thank you for applying to the <strong>{job?.title}</strong> role. The hiring team has been notified. You can track your hiring status from the applicant dashboard.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/en/careers/dashboard" className="mt-btn-primary" style={{ textDecoration: 'none' }}>
              Track Application
            </Link>
            <Link href="/en/careers" className="mt-btn-outline" style={{ textDecoration: 'none' }}>
              Back to Careers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Link href="/en/careers" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#64748B', fontSize: 13, marginBottom: 24, fontWeight: 500 }}>
          <ArrowLeft size={16} />
          Back to Jobs Board
        </Link>

        {error && (
          <div className="mt-card" style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '16px 20px', color: '#DC2626', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: 14 }}>{error}</span>
          </div>
        )}

        {/* Job Summary Banner */}
        <div className="mt-card" style={{ padding: 28, marginBottom: 28, background: '#FFFFFF' }}>
          <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
            {job?.department}
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 12, marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>{job?.title}</h1>
          <p style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{job?.companies?.name || 'RoutePro Internal Team'}</p>
          
          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 20, paddingTop: 20, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
            <p style={{ fontWeight: 600, color: '#334155', marginBottom: 8 }}>Role Description:</p>
            <p>{job?.description}</p>
          </div>
        </div>

        {/* Apply Form */}
        <div className="mt-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20, fontFamily: 'Outfit, sans-serif' }}>Submit Application</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="mt-label">Resume Link / Portfolio (Google Drive, Dropbox, PDF url)</label>
              <input 
                type="url" 
                placeholder="https://drive.google.com/file/d/..." 
                required 
                className="mt-input"
                value={cvUrl}
                onChange={e => setCvUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="mt-label">Cover Letter / Pitch</label>
              <textarea 
                rows={6}
                placeholder="Explain why you're a great fit for this position..." 
                required 
                className="mt-input"
                style={{ resize: 'none' }}
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
              />
            </div>

            <button type="submit" disabled={submitting} className="mt-btn-primary" style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? (
                <>
                  <Loader className="spin" size={16} />
                  Submitting application...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
