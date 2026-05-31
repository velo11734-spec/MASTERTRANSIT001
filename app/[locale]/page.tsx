'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function HomePage() {
  const t = useTranslations('hero')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Searching trips from "${from}" to "${to}" on date: ${date}`)
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 overflow-hidden bg-[#080812]">
      {/* Decorative premium ambient glow circles */}
      <div className="absolute top-1/4 left-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full text-center py-12 sm:py-20">
        {/* Animated Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-amber-400 mb-6 sm:mb-8 animate-pulse">
          ✨ {t('badge')}
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 font-outfit">
          {t('title')}{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
            {t('title_highlight')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-gray-400 text-base sm:text-xl mb-10 sm:mb-12 leading-relaxed">
          {t('subtitle')}
        </p>

        {/* Premium search panel container */}
        <div className="w-full max-w-4xl mx-auto mb-16 sm:mb-20">
          <form
            onSubmit={handleSearch}
            className="glass-panel p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-left"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Departure
              </label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder={t('from_placeholder')}
                className="w-full bg-[#131320] border border-gray-800 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] text-white rounded-xl py-3 px-4 outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Destination
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={t('to_placeholder')}
                className="w-full bg-[#131320] border border-gray-800 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] text-white rounded-xl py-3 px-4 outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Departure Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#131320] border border-gray-800 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] text-white rounded-xl py-3 px-4 outline-none transition-all duration-200"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aec] hover:from-[#6366f1] hover:to-[#8b5cf6] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25"
              >
                {t('search_button')}
              </button>
            </div>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-6 border-t border-gray-900/60">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">500+</div>
            <div className="text-xs sm:text-sm text-gray-500">{t('stats_trips')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">40+</div>
            <div className="text-xs sm:text-sm text-gray-500">{t('stats_companies')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">100k+</div>
            <div className="text-xs sm:text-sm text-gray-500">{t('stats_passengers')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">1,200+</div>
            <div className="text-xs sm:text-sm text-gray-500">{t('stats_routes')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
