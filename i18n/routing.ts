import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr', 'zh', 'yo', 'ig', 'ha', 'sw'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})
