'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Briefcase, FileText, Calendar, Check, X, Loader } from 'lucide-react'

export default function CompanyRecruitment() {
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddJob, setShowAddJob] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('Operations')
  const [employmentType, setEmploymentType] = useState('Full-time')
  const [location, setLocation] = useState('')
  const [workplaceType, setWorkplaceType] = useState('On-site')
  const [description, setDescription] = useState('')

  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Fetch company
        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (!comp) return
        setCompany(comp)

        // Fetch jobs published by this company
        const { data: jobsList } = await supabase
          .from('jobs')
          .select('*')
          .eq('company_id', comp.id)
          .order('created_at', { ascending: false })
        setJobs(jobsList || [])

        // Fetch applications for company's jobs
        if (jobsList && jobsList.length > 0) {
          const jobIds = jobsList.map(j => j.id)
          const { data: apps } = await supabase
            .from('job_applications')
            .select('*, jobs(*), profiles(*)')
            .in('job_id', jobIds)
            .order('created_at', { ascending: false })
          setApplications(apps || [])
        }
      } catch (err) {
        console.error('Error loading recruitment panel:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          company_id: company.id,
          title,
          department,
          employment_type: employmentType,
          location,
          workplace_type: workplaceType,
          description,
          status: 'published'
        })
        .select()
        .single()

      if (error) throw error
      setJobs([data, ...jobs])
      setShowAddJob(false)
      setTitle('')
      setLocation('')
      setDescription('')
    } catch (err: any) {
      alert(err.message || 'Failed to publish job')
    }
  }

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', appId)

      if (error) throw error
      setApplications(applications.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      alert('Application status updated!')
    } catch (err: any) {
      alert(err.message || 'Failed to update application status')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Loader className="spin" size={32} color="#16A34A" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#64748B' }}>Loading Recruitment Portal...</p>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Recruitment & Careers</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Publish openings, track incoming CVs, screen, and schedule interviews.</p>
        </div>
        <button onClick={() => setShowAddJob(true)} className="mt-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} />
          Create Job Opening
        </button>
      </div>

      {/* Main layout splitting Job listings and Applicants */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Published Jobs column */}
        <div className="mt-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={18} color="#16A34A" />
            Active Job Listings ({jobs.length})
          </h3>

          {jobs.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: 13 }}>No active listings. Create an opening to attract talent.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs.map(job => (
                <div key={job.id} style={{ border: '1px solid #E2E8F0', padding: 16, borderRadius: 8, background: '#F8FAFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{job.title}</h4>
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        {job.department} • {job.employment_type} • {job.workplace_type}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Applications column */}
        <div className="mt-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#1D4ED8" />
            Applicant Tracking ({applications.length})
          </h3>

          {applications.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: 13 }}>No applications received yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {applications.map(app => (
                <div key={app.id} style={{ border: '1px solid #E2E8F0', padding: 16, borderRadius: 8, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>{app.profiles?.full_name}</strong>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{app.profiles?.email}</span>
                      <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
                        Applied to: <strong style={{ color: '#475569' }}>{app.jobs?.title}</strong>
                      </p>
                      {app.cv_url && (
                        <a href={app.cv_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#16A34A', textDecoration: 'none', display: 'inline-block', marginTop: 8, fontWeight: 600 }}>
                          📄 View Resume / PDF
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                        {app.status}
                      </span>
                      
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleUpdateStatus(app.id, 'shortlisted')} className="mt-btn-outline" style={{ padding: '2px 6px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Check size={10} /> Shortlist
                        </button>
                        <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="mt-btn-outline" style={{ padding: '2px 6px', fontSize: 10, borderColor: '#FCA5A5', color: '#DC2626' }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddJob && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="mt-card" style={{ maxWidth: 500, width: '100%', padding: 28, background: '#FFFFFF' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Create Job opening</h3>
            
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="mt-label">Job Title</label>
                <input type="text" required placeholder="e.g. Booking Officer, Driver" className="mt-input" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="mt-label">Department</label>
                  <select className="mt-input" value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="Operations">Operations</option>
                    <option value="Bookings">Bookings</option>
                    <option value="Fleet">Fleet Management</option>
                    <option value="Sales">Sales / Dealer</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>
                <div>
                  <label className="mt-label">Employment Type</label>
                  <select className="mt-input" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="mt-label">Location (City, Country)</label>
                  <input type="text" required placeholder="Lagos, Nigeria" className="mt-input" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="mt-label">Workplace Model</label>
                  <select className="mt-input" value={workplaceType} onChange={e => setWorkplaceType(e.target.value)}>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mt-label">Job Description & Responsibilities</label>
                <textarea rows={4} required placeholder="State core requirements and responsibilities..." className="mt-input" style={{ resize: 'none' }} value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="mt-btn-primary" style={{ flex: 1 }}>Publish Job Listing</button>
                <button type="button" onClick={() => setShowAddJob(false)} className="mt-btn-outline" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
