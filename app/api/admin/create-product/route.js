// app/api/admin/create-product/route.js
// Admin adds a product on behalf of a seller (targetUserId), bypassing RLS
// via the service-role client since the caller isn't that seller's own session.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminRequest } from '@/lib/verifyAdmin';

export async function POST(request) {
  const { error: authError, status } = await verifyAdminRequest(request);
  if (authError) return NextResponse.json({ error: authError }, { status });

  try {
    const body = await request.json();
    const { targetUserId, titleKo, titleEn, companyName, location, category, moq, price, description } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId가 필요합니다.' }, { status: 400 });
    }
    const mainTitle = titleEn || titleKo || 'Export Product';
    const fobPrice = price ? `$${price} USD` : 'Negotiable';

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{
        user_id: targetUserId,
        title: mainTitle,
        title_ko: titleKo || '',
        title_en: titleEn || '',
        company_name: companyName || '',
        location: location || 'South Korea',
        category: category || 'General Manufacturing',
        moq: moq || '',
        certifications: 'Standard Production Spec',
        oem_odm: 'Not Available',
        fob_price: fobPrice,
        price: fobPrice,
        tiered_pricing: [],
        attributes: [],
        description: description || '',
        details: description || '',
        gallery_images: [],
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (err) {
    console.error('admin create-product error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
