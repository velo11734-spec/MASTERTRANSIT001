'use client'

import { useState, useEffect } from 'react'
import { FileText, Save, Check, RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface PlatformSetting {
  id?: string;
  key: string;
  value: string;
  label: string;
  description: string;
  category: string;
}

export default function AdminContentPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const defaultKeys = [
    { key: 'homepage_banner_title', label: 'Homepage Hero Title', description: 'Main heading displayed on the homepage hero section.', value: 'Search, Book, and Transit Smarter', category: 'branding' },
    { key: 'homepage_banner_subtitle', label: 'Homepage Hero Subtitle', description: 'Supporting subheading displayed below the main homepage heading.', value: 'Connecting you to luxury coaches, local buses, trains, and ferry networks across Nigeria.', category: 'branding' },
    { key: 'about_mission', label: 'About Us Mission Statement', description: 'The company mission statement displayed on the About Us page.', value: 'To digitize and elevate public transportation across West Africa by building premium technology that connects passengers and operators seamlessly.', category: 'branding' },
    { key: 'about_vision', label: 'About Us Vision Statement', description: 'The company vision statement displayed on the About Us page.', value: 'Creating a highly efficient, reliable, safe, and modern multi-modal transport network accessible to every citizen.', category: 'branding' },
    { key: 'partners_cta_title', label: 'Partners CTA Title', description: 'Heading for the Call to Action section on the Partners page.', value: 'Ready to Expand Your Transport Network?', category: 'branding' },
    { key: 'partners_cta_desc', label: 'Partners CTA Description', description: 'Supporting description for the Call to Action section on the Partners page.', value: 'Onboard your company in minutes, manage routes and fleets in real-time, and reach millions of travellers.', category: 'branding' },
    { key: 'safety_policy_excerpt', label: 'Safety Guidelines Preview', description: 'A short teaser or preview of safety guidelines shown across the platform.', value: 'Our strict safety protocols require multi-stage driver screening, verified vehicle inspections, and live GPS tracking.', category: 'safety' }
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('platform_settings')
        .select('*')
        .in('key', defaultKeys.map(k => k.key))

      if (fetchErr) throw fetchErr

      // Merge defaults with loaded data to ensure all keys exist in state
      const merged: PlatformSetting[] = defaultKeys.map(def => {
        const found = data?.find(item => item.key === def.key)
        return found ? { ...found } : { ...def }
      })

      setSettings(merged)
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError(err.message || 'Failed to load content settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const handleSave = async (setting: PlatformSetting) => {
    setSavingKey(setting.key)
    setError(null)
    setSuccess(null)

    try {
      // Get current user for audit logs
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized admin user.')

      const { data, error: upsertErr } = await supabase
        .from('platform_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          label: setting.label,
          description: setting.description,
          category: setting.category,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .select()

      if (upsertErr) throw upsertErr

      // Log the admin action to audit logs
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'update_content_setting',
        entity_type: 'platform_settings',
        entity_id: setting.key,
        new_value: { value: setting.value }
      })

      setSuccess(`"${setting.label}" successfully updated and logged.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error updating setting:', err)
      setError(err.message || 'Failed to save changes.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div style={{ fontFamily: "'Outfit','Inter',sans-serif", maxWidth: 1000 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');`}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>Admin &gt; Content Management</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Dynamic Content Customizer</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Modify homepage banners, partners page copy, safety briefs and vision statements in real-time.</p>
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
          <p>Retrieving platform settings & copy...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Grouping Settings by Category */}
          {['branding', 'safety'].map(category => {
            const categorySettings = settings.filter(s => s.category === category)
            if (categorySettings.length === 0) return null

            return (
              <div key={category} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                  <Sparkles size={16} style={{ color: '#16A34A' }} />
                  {category === 'branding' ? 'General Copy & Branding' : 'Safety & Legal Previews'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {categorySettings.map(setting => (
                    <div key={setting.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <label style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{setting.label}</label>
                          <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{setting.description}</p>
                        </div>
                        <button
                          onClick={() => handleSave(setting)}
                          disabled={savingKey === setting.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: '#16A34A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            opacity: savingKey === setting.key ? 0.7 : 1
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#15803D'}
                          onMouseLeave={e => e.currentTarget.style.background = '#16A34A'}
                        >
                          {savingKey === setting.key ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Save size={12} />
                          )}
                          Save
                        </button>
                      </div>

                      <textarea
                        value={setting.value}
                        onChange={e => handleInputChange(setting.key, e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: 13,
                          color: '#334155',
                          fontFamily: 'inherit',
                          outline: 'none',
                          resize: 'vertical',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
