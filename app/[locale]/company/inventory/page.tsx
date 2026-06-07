'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Sparkles, Plus, Trash2, AlertCircle, Tag, TagIcon } from 'lucide-react'

export default function InventoryPage() {
  const [company, setCompany] = useState<any>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showModal, setShowModal] = useState(false)
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [price, setPrice] = useState('')
  const [mileage, setMileage] = useState('')
  const [status, setStatus] = useState('available')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInventory() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data: comp } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (comp) {
          setCompany(comp)
          // Fetch from vehicles table (Marketplace Vehicle Sales Listings)
          // Fallback to empty array if query fails
          const { data: vData } = await supabase
            .from('vehicles')
            .select('*')
            .eq('fleet_id', comp.id) // Using company_id/fleet_id reference mapping
          setVehicles(vData || [])
        }
      } catch (err) {
        console.error('Failed to load inventory:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [])

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setError(null)
    setSubmitting(true)

    const priceNum = parseFloat(price)
    const yearNum = parseInt(year)
    const milNum = parseFloat(mileage)

    if (!brand || !model || isNaN(priceNum) || priceNum <= 0) {
      setError('Brand, Model, and a valid Sales Price are required.')
      setSubmitting(false)
      return
    }

    try {
      // Create listing in vehicles table
      const { data, error: addErr } = await supabase
        .from('vehicles')
        .insert({
          fleet_id: company.id, // Linked to company/fleet container
          name: `${brand} ${model}`,
          number_plate: 'SALES-LISTING',
          capacity: yearNum, // Map year/mileage parameters to details payload
          class: status,
          amenities: { brand, model, price: priceNum, mileage: milNum }
        })
        .select()
        .single()

      if (addErr) throw addErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_showroom_add',
        entity_type: 'vehicles',
        entity_id: data.id,
        new_value: { name: data.name, price: priceNum }
      })

      setVehicles(prev => [data, ...prev])
      setShowModal(false)
      setBrand('')
      setModel('')
      setYear('')
      setPrice('')
      setMileage('')
      setStatus('available')
    } catch (err: any) {
      console.error('Add inventory error:', err)
      setError(err.message || 'Failed to list vehicle in showroom.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteInventory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marketplace listing?')) return

    try {
      const { error: delErr } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (delErr) throw delErr

      // Log action
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_email: (await supabase.auth.getUser()).data.user?.email,
        action: 'company_showroom_delete',
        entity_type: 'vehicles',
        entity_id: id
      })

      setVehicles(prev => prev.filter(v => v.id !== id))
    } catch (err) {
      console.error('Delete inventory error:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 48, width: '40%' }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Dealership Inventory</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Add listings, manage vehicle specifications, and negotiate purchase tags on the marketplace</p>
        </div>
        <button onClick={() => setShowModal(true)} className="mt-btn-primary btn-press">
          <Plus size={16} /> List Vehicle
        </button>
      </div>

      {/* Grid of listings */}
      <div className="mt-card" style={{ background: '#FFFFFF', borderRadius: 12, padding: 24 }}>
        {vehicles.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Sparkles size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#64748B' }}>No showroom listings recorded yet. Click "List Vehicle" to start marketing.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {vehicles.map(v => {
              const meta = v.amenities || {}
              return (
                <div key={v.id} className="mt-card card-hover" style={{ borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Photo Placeholder */}
                  <div style={{ height: 160, background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                    <Sparkles size={36} />
                  </div>
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <strong style={{ fontSize: 15, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{v.name}</strong>
                      <span style={{ fontSize: 10, background: '#DCFCE7', color: '#15803D', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{v.class || 'Available'}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>Year: {v.capacity || 'N/A'} • Mileage: {meta.mileage ? `${meta.mileage.toLocaleString()} km` : 'N/A'}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#16A34A', fontFamily: 'Outfit, sans-serif' }}>₦{meta.price ? meta.price.toLocaleString() : 'N/A'}</span>
                      <button
                        onClick={() => handleDeleteInventory(v.id)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* List Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <form onSubmit={handleAddInventory} className="mt-card modal-in" style={{ background: '#FFFFFF', padding: 32, borderRadius: 16, maxWidth: 500, width: '100%', margin: '0 16px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>List Marketplace Vehicle</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Configure target sales specs and listing price tags</p>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="mt-label">Manufacturer Brand *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lexus"
                  className="mt-input"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Model Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RX350"
                  className="mt-input"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="mt-label">Year of Manufacture</label>
                <input
                  type="number"
                  placeholder="e.g. 2020"
                  className="mt-input"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Mileage (KM)</label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  className="mt-input"
                  value={mileage}
                  onChange={e => setMileage(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label className="mt-label">Sales Price (₦) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 18500000"
                  className="mt-input"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="mt-label">Initial Status *</label>
                <select className="mt-input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="available">Available (Active)</option>
                  <option value="sold">Sold (Archived)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} className="mt-btn-outline btn-press" style={{ height: 40 }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="mt-btn-primary btn-press" style={{ height: 40 }}>
                {submitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
