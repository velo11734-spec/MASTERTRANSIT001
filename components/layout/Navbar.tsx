'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/client'
import LanguageSwitcher from './LanguageSwitcher'
import { useState } from 'react'

export default function Navbar() {
  const t = useTranslations('nav')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="glass-panel fixed top-0 w-full z-50 border-b border-gray-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-200">
                MasterTransit
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              {t('home')}
            </Link>
            <Link
              href="/search"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              {t('search')}
            </Link>
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              {t('login')}
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aec] hover:from-[#6366f1] hover:to-[#8b5cf6] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20"
            >
              {t('register')}
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="md:hidden flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0f] border-b border-gray-800 py-4 px-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-white text-base font-medium py-2"
          >
            {t('home')}
          </Link>
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-white text-base font-medium py-2"
          >
            {t('search')}
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-gray-300 hover:text-white text-base font-medium py-2"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="block bg-gradient-to-r from-[#4f46e5] to-[#7c3aec] text-white text-center py-2.5 rounded-xl text-base font-semibold"
          >
            {t('register')}
          </Link>
        </div>
      )}
    </nav>
  )
}
