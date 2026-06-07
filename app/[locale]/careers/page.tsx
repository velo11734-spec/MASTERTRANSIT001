'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Search, MapPin, Briefcase, DollarSign, Building, ArrowRight, Loader } from 'lucide-react'
import Link from 'next/link'

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterWorkplace, setFilterWorkplace] = useState('All')
  const [filterLocation, setFilterLocation] = useState('All')

  useEffect(() => {
    async function fetchJobs() {
      try {
        let query = supabase
          .from('jobs')
          .select('*, companies(name)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        const { data, error } = await query
        if (error) throw error
        setJobs(data || [])
      } catch (err) {
        console.error('Error fetching jobs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.companies?.name || 'RoutePro Internal').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'All' || job.employment_type === filterType
    const matchesWorkplace = filterWorkplace === 'All' || job.workplace_type === filterWorkplace
    const matchesLocation = filterLocation === 'All' || job.location.includes(filterLocation)

    return matchesSearch && matchesType && matchesWorkplace && matchesLocation
  })

  // List of unique locations for selection
  const locations = Array.from(new Set(jobs.map(j => j.location.split(',')[0])))

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '48px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 24,
          padding: '60px 40px',
          color: '#FFFFFF',
          marginBottom: 40,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 640 }}>
            <span style={{ background: '#22C55E', color: '#FFFFFF', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RoutePro Careers Portal</span>
            <h1 style={{ fontSize: 36, fontWeight: 900, marginTop: 16, marginBottom: 16, fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
              Build the Future of Mobility & Business Operations
            </h1>
            <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
              Join the RoutePro internal team or work directly with one of our hundreds of verified transport operators, dealerships, and rental providers.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="#openings" className="mt-btn-primary" style={{ textDecoration: 'none' }}>Browse Openings</a>
              <Link href="/en/careers/dashboard" className="mt-btn-outline" style={{ color: '#FFFFFF', borderColor: '#475569', textDecoration: 'none' }}>
                Applicant Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div id="openings" className="mt-card" style={{ padding: 24, marginBottom: 32, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
          <div>
            <label className="mt-label">Search Jobs</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="Title, company, keywords..." 
                className="mt-input" 
                style={{ paddingLeft: 36 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mt-label">Job Type</label>
            <select className="mt-input" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="mt-label">Workplace</label>
            <select className="mt-input" value={filterWorkplace} onChange={e => setFilterWorkplace(e.target.value)}>
              <option value="All">All Locations</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="mt-label">City</label>
            <select className="mt-input" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
              <option value="All">All Cities</option>
              {locations.map((loc, i) => (
                <option key={i} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader className="spin" size={32} color="#16A34A" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#64748B' }}>Loading career opportunities...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="mt-card text-center" style={{ padding: '60px 24px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No jobs match your filters</h3>
            <p style={{ color: '#64748B', fontSize: 14 }}>Try adjusting your keywords or filter parameters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredJobs.map((job) => (
              <div key={job.id} className="mt-card hover-glow" style={{ padding: 24, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', fontWeight: 700, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>
                      {job.department}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>{job.title}</h3>
                    
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#64748B' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building size={14} />
                        {job.companies?.name || 'RoutePro Internal Team'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={14} />
                        {job.location} ({job.workplace_type})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Briefcase size={14} />
                        {job.employment_type}
                      </span>
                      {(job.salary_min || job.salary_max) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16A34A', fontWeight: 600 }}>
                          <DollarSign size={14} />
                          ₦{job.salary_min?.toLocaleString()} - ₦{job.salary_max?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link href={`/en/careers/apply/${job.id}`} className="mt-btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Apply Now
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
