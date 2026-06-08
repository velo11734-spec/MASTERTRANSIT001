import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/company/dashboard/'],
    },
    sitemap: 'https://routepro-starts.vercel.app/sitemap.xml',
  }
}
