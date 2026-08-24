// app/robots.js
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klick.biz';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/chat', '/buyer/', '/seller/']
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
