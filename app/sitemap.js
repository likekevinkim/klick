// app/sitemap.js
import { supabase } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klick.biz';

export default async function sitemap() {
  const staticRoutes = ['', '/catalog', '/factories', '/rfq', '/about'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date()
  }));

  const { data: products } = await supabase.from('products').select('id, updated_at, created_at');
  const { data: companies } = await supabase.from('companies').select('user_id, updated_at, created_at');

  const productRoutes = (products || []).map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: p.updated_at || p.created_at || new Date()
  }));

  const companyRoutes = (companies || []).map((c) => ({
    url: `${SITE_URL}/companies/${c.user_id}`,
    lastModified: c.updated_at || c.created_at || new Date()
  }));

  return [...staticRoutes, ...productRoutes, ...companyRoutes];
}
