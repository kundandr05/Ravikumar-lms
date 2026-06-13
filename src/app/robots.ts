import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/student/'],
    },
    sitemap: 'https://ravikumar-lms.vercel.app/sitemap.xml',
  }
}
