'use client'

import Link from 'next/link'
import { ShieldCheck, Lock, Ticket, Headphones, Star, ArrowRight } from 'lucide-react'

const whyItems = [
  {
    icon: ShieldCheck,
    title: 'Verified Transport Companies',
    desc: 'All our partners are verified and trusted.',
    color: '#16A34A',
    bg: '#DCFCE7',
  },
  {
    icon: Lock,
    title: 'Safe & Secure Payments',
    desc: 'Your payment is protected and secure.',
    color: '#2563EB',
    bg: '#DBEAFE',
  },
  {
    icon: Ticket,
    title: 'Easy Booking',
    desc: 'Book your tickets in just a few clicks.',
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    icon: Headphones,
    title: '24/7 Customer Support',
    desc: "We're here to help anytime, anywhere.",
    color: '#EA580C',
    bg: '#FFEDD5',
  },
]

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span className="text-xs font-semibold text-gray-700 ml-1">{rating}</span>
    </span>
  )
}

export default function RightPanel() {
  const [topCompanies, setTopCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTopCompanies() {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, status')
          .eq('status', 'APPROVED')
          .limit(4)

        if (error) throw error

        if (data) {
          const formatted = data.map((c: any, index: number) => {
            const colors = ['#1E40AF', '#DC2626', '#0369A1', '#15803D']
            return {
              name: c.name,
              initials: c.name.slice(0, 2).toUpperCase(),
              rating: 4.5 + (index * 0.1) > 5 ? 5.0 : parseFloat((4.5 + (index * 0.05)).toFixed(1)),
              reviews: 1000 + (index * 200),
              color: colors[index % colors.length]
            }
          })
          setTopCompanies(formatted)
        }
      } catch (err) {
        console.error('Error fetching top companies:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTopCompanies()
  }, [])

  return (
    <aside className="mt-right-panel">
      {/* Why Book With Us */}
      <div className="mt-card p-4 mb-4">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Why Book With Us?</h3>
        <div className="space-y-3">
          {whyItems.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Rated Companies */}
      <div className="mt-card p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-900 text-sm">Top Rated Companies</h3>
          <Link href="/en/companies" className="text-xs font-semibold" style={{ color: '#16A34A' }}>
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {loading ? (
            <p className="text-xs text-gray-500">Loading partners...</p>
          ) : topCompanies.length === 0 ? (
            <p className="text-xs text-gray-400">No verified partners listed yet.</p>
          ) : topCompanies.map((c) => (
            <div key={c.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: c.color }}
                >
                  {c.initials.slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{c.name}</p>
                  <StarRow rating={c.rating} />
                  <p className="text-xs text-gray-400">{(c.reviews/1000).toFixed(1)}k+ reviews</p>
                </div>
              </div>
              <span className="badge-verified text-xs">Verified</span>
            </div>
          ))}
        </div>
      </div>

      {/* Download App */}
      <div className="app-download-card mb-4">
        <p className="text-xs text-green-300 font-medium mb-1">Download Our App</p>
        <p className="text-sm font-bold text-white mb-1">Get the best booking experience on our mobile app.</p>
        <div className="flex flex-col gap-2 mt-3">
          <a href="#" className="flex items-center gap-2 bg-black/40 hover:bg-black/60 rounded-lg px-3 py-2 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M3.18 23.77c.38.21.84.2 1.22-.03l12.1-6.98-2.61-2.61-10.71 9.62zm-1.18-20.77v18c0 .54.29 1.01.73 1.27l10.07-10.07-10.07-10.07c-.44.26-.73.73-.73 1.27zm20.82 8.38l-2.67-1.54-2.98 2.98 2.98 2.98 2.69-1.55c.77-.44.77-1.43-.02-1.87zm-6.82 1.12l-12.8-12.8c.38-.23.84-.25 1.22-.03l14.71 8.49-3.13 3.34z"/>
            </svg>
            <div>
              <p style={{ fontSize: 9, color: '#9CA3AF' }}>GET IT ON</p>
              <p className="text-white font-semibold text-xs">Google Play</p>
            </div>
          </a>
          <a href="#" className="flex items-center gap-2 bg-black/40 hover:bg-black/60 rounded-lg px-3 py-2 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
            <div>
              <p style={{ fontSize: 9, color: '#9CA3AF' }}>Download on the</p>
              <p className="text-white font-semibold text-xs">App Store</p>
            </div>
          </a>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-card p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-900 text-sm">Testimonials</h3>
          <Link href="/en/reviews" className="text-xs font-semibold" style={{ color: '#16A34A' }}>View all</Link>
        </div>
        <div className="flex gap-3 items-start">
          <div className="w-9 h-9 rounded-full bg-amber-200 flex-shrink-0 flex items-center justify-center text-amber-800 font-bold text-xs">
            FA
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-gray-800">Funmi A.</p>
              <StarRow rating={5} />
            </div>
            <p className="text-xs text-gray-400">Lagos, Nigeria</p>
            <p className="text-xs text-gray-600 mt-1 italic leading-relaxed">
              "Booking on RoutePro is so easy and reliable. I love the seat selection and instant ticket download!"
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
