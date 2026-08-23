// app/products/[id]/page.jsx
// Thin server wrapper — exists only so this route gets real per-product
// <title>/description metadata for search engines; ProductDetailClient (still
// 'use client') keeps all the interactive logic unchanged.
import { supabase } from '@/lib/supabase';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata({ params }) {
  const { id } = await params;

  const { data: product } = await supabase
    .from('products')
    .select('title_en, title_ko, tagline, category')
    .eq('id', id)
    .maybeSingle();

  if (!product) {
    return { title: 'Product | KLICK' };
  }

  const title = product.title_en || product.title_ko || 'Export Product';
  const description = product.tagline || `${product.category || 'Manufactured product'} sourced from a verified Korean manufacturer on KLICK.`;

  return {
    title: `${title} | KLICK`,
    description,
    openGraph: { title, description }
  };
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
