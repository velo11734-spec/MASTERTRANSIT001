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
          className="inline-flex justify-center items-center rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          🌐 <span className="ml-2 uppercase">{locale}</span>
        </button>
      </div>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-xl bg-white border border-gray-150 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                className={`w-full text-left block px-4 py-2 text-sm transition-colors duration-150 ${
                  locale === lang.code
                    ? 'bg-[#16A34A] text-white font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
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
