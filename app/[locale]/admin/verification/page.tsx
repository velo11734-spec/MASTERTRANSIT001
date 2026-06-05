'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Check, X, RefreshCw, Eye, AlertCircle, FileText, UserCheck, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface CompanyVerification {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  reg_number?: string;
  owner_id?: string;
  address?: string;
}

export default function AdminVerificationPage() {
  const [companies, setCompanies] = useState<CompanyVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<CompanyVerification | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    fetchPendingCompanies()
  }, [])

  const fetchPendingCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      setCompanies(data || [])
    } catch (err: any) {
      console.error('Error fetching pending companies:', err)
      setError(err.message || 'Failed to load pending verifications.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (company: CompanyVerification) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized admin user.')

      // Update status to APPROVED
      const { error: updateErr } = await supabase
        .from('companies')
        .update({ status: 'APPROVED' })
        .eq('id', company.id)

      if (updateErr) throw updateErr

      // Log to audit logs
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'approve_company_verification',
        entity_type: 'companies',
        entity_id: company.id,
        new_value: { status: 'APPROVED' }
      })

      // Send a system notification to the company owner profile if exists
      if (company.owner_id) {
        await supabase.from('admin_notifications').insert({
          title: 'Partner Account Approved',
          body: `Congratulations, ${company.name} has been verified as an official RoutePro partner!`,
          type: 'success',
          link: '/dashboard',
          entity_type: 'company',
          entity_id: company.id
        })
      }

      setCompanies(prev => prev.filter(c => c.id !== company.id))
      setSuccess(`Company "${company.name}" has been successfully approved!`)
      setSelectedCompany(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error approving company:', err)
      setError(err.message || 'Failed to approve company.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCompany || !rejectionReason.trim()) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized admin user.')

      // Update company status to REJECTED
      const { error: updateErr } = await supabase
        .from('companies')
        .update({ status: 'REJECTED' })
        .eq('id', selectedCompany.id)

      if (updateErr) throw updateErr

      // Log action to audit logs
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'reject_company_verification',
        entity_type: 'companies',
        entity_id: selectedCompany.id,
        new_value: { status: 'REJECTED', reason: rejectionReason }
      })

      setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id))
      setSuccess(`Company "${selectedCompany.name}" verification request rejected.`)
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedCompany(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error rejecting company:', err)
      setError(err.message || 'Failed to reject company.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Outfit','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');`}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Admin &gt; Verification Center</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Verification Queue</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Review newly registered transport partners, examine CAC documents, and grant portal access credentials.</p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 13, marginBottom: 20 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', fontSize: 13, marginBottom: 20 }}>
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading verification queue...</p>
        </div>
      ) : companies.length === 0 ? (
        <div style={{ background: '#FFFFFF', padding: 48, borderRadius: 16, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
          <ShieldCheck size={48} style={{ color: '#16A34A', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600 }}>All caught up!</p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>No companies are currently awaiting verification.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {companies.map(company => (
            <div key={company.id} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{company.name}</h3>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Email: {company.email} | Address: {company.address || 'Not Provided'}</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    Reg: {company.reg_number || 'N/A'}
                  </span>
                  <span style={{ fontSize: 11, background: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                    Awaiting Review
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSelectedCompany(company)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FAFAFA'}
                >
                  <Eye size={14} />
                  Review Details
                </button>
                <button
                  onClick={() => handleApprove(company)}
                  disabled={actionLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    background: '#16A34A', border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#15803D'}
                  onMouseLeave={e => e.currentTarget.style.background = '#16A34A'}
                >
                  <Check size={14} />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Details Modal */}
      {selectedCompany && !showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 550, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Partner Onboarding Review</h3>
              <button onClick={() => setSelectedCompany(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Corporate Profile</h4>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{selectedCompany.name}</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{selectedCompany.address || 'No corporate address provided.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>CAC Registration No.</h4>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{selectedCompany.reg_number || 'Under Review'}</p>
                </div>
                <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Onboarding Date</h4>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{new Date(selectedCompany.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Submitted Verification Documents</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px dashed #CBD5E1', borderRadius: 8, background: '#FAFAFA' }}>
                  <FileText size={20} style={{ color: '#64748B' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>CAC_Incorporation_Certificate.pdf</p>
                    <p style={{ fontSize: 10, color: '#94A3B8' }}>PDF document • Uploaded by owner</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>VERIFIED CAC</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowRejectModal(true)}
                style={{ padding: '8px 16px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Reject Request
              </button>
              <button
                onClick={() => handleApprove(selectedCompany)}
                disabled={actionLoading}
                style={{ padding: '8px 16px', background: '#16A34A', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}
              >
                {actionLoading ? 'Approving...' : 'Approve & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && selectedCompany && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Specify Rejection Reason</h3>
              <button onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Provide the reason for rejection (e.g. Invalid CAC registration number, illegible document upload)..."
              rows={4}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical', marginBottom: 20 }}
            />

            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '8px 16px', background: '#F1F5F9', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                style={{ padding: '8px 16px', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', opacity: actionLoading || !rejectionReason.trim() ? 0.7 : 1 }}
              >
                {actionLoading ? 'Rejecting...' : 'Reject & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
