'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, CheckCircle2, Upload, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Step5() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingState, setUploadingState] = useState({
    cac: false,
    insurance: false,
    license: false,
  })
  
  const [files, setFiles] = useState<{
    cac: File | null
    insurance: File | null
    license: File | null
  }>({
    cac: null,
    insurance: null,
    license: null,
  })

  const fileInputs = {
    cac: useRef<HTMLInputElement>(null),
    insurance: useRef<HTMLInputElement>(null),
    license: useRef<HTMLInputElement>(null),
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: 'cac' | 'insurance' | 'license') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.')
        return
      }
      setFiles(prev => ({ ...prev, [key]: file }))
    }
  }

  const uploadFileToBucket = async (file: File, bucketName: string, companyId: string) => {
    const fileName = `${companyId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.cac || !files.insurance) {
      alert('Please upload all required files')
      return
    }

    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User session not found')
      }

      // Fetch company id
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (companyErr || !company) {
        throw new Error('Company not found. Please complete Step 1 first.')
      }

      // Upload CAC
      setUploadingState(prev => ({ ...prev, cac: true }))
      const cacUrl = await uploadFileToBucket(files.cac, 'company_cac', company.id)
      await supabase.from('company_verifications').insert({
        company_id: company.id,
        doc_type: 'cac_certificate',
        file_url: cacUrl,
      })

      // Upload Insurance
      setUploadingState(prev => ({ ...prev, insurance: true }))
      const insuranceUrl = await uploadFileToBucket(files.insurance, 'company_insurance', company.id)
      await supabase.from('company_verifications').insert({
        company_id: company.id,
        doc_type: 'insurance',
        file_url: insuranceUrl,
      })

      // Upload License if present
      if (files.license) {
        setUploadingState(prev => ({ ...prev, license: true }))
        const licenseUrl = await uploadFileToBucket(files.license, 'company_ids', company.id)
        await supabase.from('company_verifications').insert({
          company_id: company.id,
          doc_type: 'operating_license',
          file_url: licenseUrl,
        })
      }

      router.push('/en/company/onboarding/step-6')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Verification documents upload failed. Please try again.')
    } finally {
      setLoading(false)
      setUploadingState({ cac: false, insurance: false, license: false })
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Vehicle & Business Documents</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Upload required documentation for verification. Maximum file size is 5MB (PDF, JPG, PNG).</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* CAC */}
        <div className="mt-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>CAC Registration Certificate <span style={{ color: '#DC2626' }}>*</span></p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Corporate Affairs Commission document proving business registration.</p>
            </div>
            {files.cac && <CheckCircle2 size={20} color="#16A34A" />}
          </div>
          <input 
            type="file" 
            ref={fileInputs.cac} 
            onChange={(e) => handleFileChange(e, 'cac')} 
            style={{ display: 'none' }} 
            accept="application/pdf,image/*"
            required
          />
          <button 
            type="button" 
            onClick={() => fileInputs.cac.current?.click()} 
            style={{ width: '100%', padding: '24px', border: '1.5px dashed #CBD5E1', borderRadius: 8, background: files.cac ? '#F0FDF4' : '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Upload size={20} color={files.cac ? '#16A34A' : '#64748B'} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: files.cac ? '#15803D' : '#475569' }}>
              {files.cac ? `${files.cac.name} selected` : 'Click to select CAC Certificate'}
            </p>
          </button>
        </div>

        {/* Insurance */}
        <div className="mt-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Fleet Insurance Policy <span style={{ color: '#DC2626' }}>*</span></p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Comprehensive or third-party insurance covering your vehicles.</p>
            </div>
            {files.insurance && <CheckCircle2 size={20} color="#16A34A" />}
          </div>
          <input 
            type="file" 
            ref={fileInputs.insurance} 
            onChange={(e) => handleFileChange(e, 'insurance')} 
            style={{ display: 'none' }} 
            accept="application/pdf,image/*"
            required
          />
          <button 
            type="button" 
            onClick={() => fileInputs.insurance.current?.click()} 
            style={{ width: '100%', padding: '24px', border: '1.5px dashed #CBD5E1', borderRadius: 8, background: files.insurance ? '#F0FDF4' : '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Upload size={20} color={files.insurance ? '#16A34A' : '#64748B'} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: files.insurance ? '#15803D' : '#475569' }}>
              {files.insurance ? `${files.insurance.name} selected` : 'Click to select Insurance Policy'}
            </p>
          </button>
        </div>

        {/* License */}
        <div className="mt-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Operating License (Optional)</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>State or inter-state transport operating license if applicable.</p>
            </div>
            {files.license && <CheckCircle2 size={20} color="#16A34A" />}
          </div>
          <input 
            type="file" 
            ref={fileInputs.license} 
            onChange={(e) => handleFileChange(e, 'license')} 
            style={{ display: 'none' }} 
            accept="application/pdf,image/*"
          />
          <button 
            type="button" 
            onClick={() => fileInputs.license.current?.click()} 
            style={{ width: '100%', padding: '24px', border: '1.5px dashed #CBD5E1', borderRadius: 8, background: files.license ? '#F0FDF4' : '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Upload size={20} color={files.license ? '#16A34A' : '#64748B'} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: files.license ? '#15803D' : '#475569' }}>
              {files.license ? `${files.license.name} selected` : 'Click to select License'}
            </p>
          </button>
        </div>

        <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 8, padding: 16, display: 'flex', gap: 12 }}>
          <AlertCircle size={20} color="#EA580C" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#9A3412', lineHeight: 1.5 }}>
            By uploading these documents, you confirm they are authentic and belong to your registered transport business. Fake documents will lead to permanent ban.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <button type="button" onClick={() => router.back()} className="mt-btn-outline" style={{ padding: '12px 24px' }}>Back</button>
          <button type="submit" disabled={loading || !files.cac || !files.insurance} className="mt-btn-primary" style={{ padding: '12px 32px' }}>
            {loading ? 'Uploading & Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}
