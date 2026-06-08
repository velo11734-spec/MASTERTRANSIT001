'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Search, Eye, FileText, Download, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface VerificationDoc {
  id: string
  doc_type: string
  file_url: string
}

interface Company {
  id: string
  name: string
  cac_number: string
  owner_id: string
  status: string
  created_at: string
  address: string
  city: string
  state: string
  phone: string
  bank_name?: string
  bank_account_number?: string
  profiles?: {
    full_name: string
  }
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentTab, setCurrentTab] = useState<'All' | 'APPROVED' | 'PENDING' | 'REJECTED'>('All')
  
  // Modal review state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [documents, setDocuments] = useState<VerificationDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          profiles:owner_id (full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (err) {
      console.error('Error fetching companies:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    let result = companies
    if (currentTab !== 'All') {
      result = result.filter(c => c.status === currentTab)
    }
    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.cac_number.toLowerCase().includes(query) ||
        (c.profiles?.full_name && c.profiles.full_name.toLowerCase().includes(query))
      )
    }
    setFilteredCompanies(result)
  }, [companies, search, currentTab])

  const handleReviewClick = async (company: Company) => {
    setSelectedCompany(company)
    setLoadingDocs(true)
    try {
      const { data, error } = await supabase
        .from('company_verifications')
        .select('*')
        .eq('company_id', company.id)

      if (error) throw error
      setDocuments(data || [])
    } catch (err) {
      console.error('Error fetching docs:', err)
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedCompany) return
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status })
        .eq('id', selectedCompany.id)

      if (error) throw error
      
      // Update local state
      setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, status } : c))
      setSelectedCompany(null)
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update company status.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Admin Portal</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Company Management</h1>
          </div>
          
          {/* Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Search companies, RC number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-input" 
              style={{ paddingLeft: 38 }} 
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {([
            { label: 'All', value: 'All' },
            { label: 'Verified', value: 'APPROVED' },
            { label: 'Pending Review', value: 'PENDING' },
            { label: 'Rejected', value: 'REJECTED' }
          ] as const).map(tab => (
            <button 
              key={tab.value} 
              onClick={() => setCurrentTab(tab.value)}
              style={{
                background: currentTab === tab.value ? '#1E293B' : '#FFFFFF',
                color: currentTab === tab.value ? '#FFFFFF' : '#64748B',
                border: `1px solid ${currentTab === tab.value ? '#1E293B' : '#E2E8F0'}`,
                padding: '6px 14px', 
                borderRadius: 8, 
                fontSize: 13, 
                fontWeight: 600, 
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="mt-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading companies data...</div>
          ) : filteredCompanies.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No companies found.</div>
          ) : (
            <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Company Info</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Registration</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Date Applied</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9', background: c.status === 'PENDING' ? '#FEF9C315' : '#FFF' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{c.name}</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>Owner: {c.profiles?.full_name || 'N/A'}</p>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.cac_number}</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>{c.phone || 'No phone'}</p>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: '#374151' }}>
                      {new Date(c.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {c.status === 'APPROVED' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}><CheckCircle2 size={12} /> Verified</span>}
                      {c.status === 'PENDING' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF9C3', color: '#854D0E', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}><FileText size={12} /> Pending</span>}
                      {c.status === 'REJECTED' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}><XCircle size={12} /> Rejected</span>}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleReviewClick(c)}
                        className="mt-btn-primary" 
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        {c.status === 'PENDING' ? 'Review Application' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          )}
        </div>

        {/* Verification Modal */}
        {selectedCompany && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
          }}>
            <div className="mt-card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 28, position: 'relative' }}>
              <button 
                onClick={() => setSelectedCompany(null)}
                style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginBottom: 6 }}>
                Review Application
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                Verification request from <strong>{selectedCompany.name}</strong>
              </p>

              {/* Company Info */}
              <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>RC / CAC Number</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{selectedCompany.cac_number}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Owner Name</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{selectedCompany.profiles?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Contact Phone</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{selectedCompany.phone || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>HQ Address</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
                    {selectedCompany.address ? `${selectedCompany.address}, ${selectedCompany.city}, ${selectedCompany.state}` : 'N/A'}
                  </p>
                </div>
                {selectedCompany.bank_name && (
                  <>
                    <div>
                      <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Payout Bank</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{selectedCompany.bank_name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Account Number</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{selectedCompany.bank_account_number}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Uploaded Documents */}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Uploaded Verification Documents</h3>
              {loadingDocs ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748B' }}>Loading uploaded files...</div>
              ) : documents.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#DC2626', fontSize: 13, background: '#FEE2E2', borderRadius: 8, marginBottom: 20 }}>
                  No uploaded files found for this company.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="#16A34A" />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>
                            {doc.doc_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-btn-outline" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                      >
                        <Eye size={12} /> View File
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {selectedCompany.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="mt-btn-outline" 
                    style={{ borderColor: '#DC2626', color: '#DC2626', padding: '10px 20px' }}
                  >
                    Reject Application
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('APPROVED')}
                    className="mt-btn-primary" 
                    style={{ padding: '10px 24px' }}
                  >
                    {actionLoading ? 'Verifying...' : 'Approve & Verify'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
