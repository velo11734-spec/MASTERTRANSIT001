'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/client'
import { useState } from 'react'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'zh', name: '中文' },
    { code: 'yo', name: 'Yorùbá' },
    { code: 'ig', name: 'Asụsụ Igbo' },
    { code: 'ha', name: 'Hausa' },
    { code: 'sw', name: 'Kiswahili' },
  ]

  const selectLanguage = (code: string) => {
    router.replace(pathname, { locale: code })
    setOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          onClick={() => setOpen(!open)}
          type="button"
          className="inline-flex justify-center items-center w-full rounded-xl border border-gray-800 shadow-sm px-4 py-2 bg-[#0f0f1a] text-sm font-medium text-gray-300 hover:bg-[#161625] focus:outline-none"
        >
          🌐 <span className="ml-2 uppercase">{locale}</span>
        </button>
      </div>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-44 rounded-xl shadow-lg bg-[#0f0f1a] border border-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                className={`w-full text-left block px-4 py-2.5 text-sm transition-all duration-200 ${
                  locale === lang.code
                    ? 'bg-[#4f46e5] text-white'
                    : 'text-gray-300 hover:bg-[#161625]'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
