// app/companies/[id]/page.jsx
// Thin server wrapper — exists only so this route gets real per-company
// <title>/description metadata for search engines; CompanyDetailClient (still
// 'use client') keeps all the interactive logic and lookup fallbacks unchanged.
import { supabase } from '@/lib/supabase';
import CompanyDetailClient from './CompanyDetailClient';

const isUuid = (str) =>
  typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
const isInteger = (str) => typeof str === 'string' && /^\d+$/.test(str);

async function fetchCompanyForMetadata(routeParamId) {
  const cols = 'company_name_en, company_name_ko, tagline, category';
  if (!routeParamId) return null;

  if (isUuid(routeParamId)) {
    const { data: byUserId } = await supabase.from('companies').select(cols).eq('user_id', routeParamId).maybeSingle();
    if (byUserId) return byUserId;
    const { data: byId } = await supabase.from('companies').select(cols).eq('id', routeParamId).maybeSingle();
    return byId || null;
  }

  if (isInteger(routeParamId)) {
    const { data } = await supabase.from('companies').select(cols).eq('id', parseInt(routeParamId, 10)).maybeSingle();
    return data || null;
  }

  const { data } = await supabase.from('companies').select(cols).eq('id', routeParamId).maybeSingle();
  return data || null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const company = await fetchCompanyForMetadata(id);

  if (!company) {
    return { title: 'Company | KLICK' };
  }

  const title = company.company_name_en || company.company_name_ko || 'Verified Korean Company';
  const description = company.tagline || `${company.category || 'Korean manufacturer'} on KLICK — a verified B2B export platform connecting Korean factories with global buyers.`;

  return {
    title: `${title} | KLICK`,
    description,
    openGraph: { title, description }
  };
}

export default function CompanyDetailPage() {
  return <CompanyDetailClient />;
}
