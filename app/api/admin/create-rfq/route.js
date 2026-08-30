// app/api/admin/create-rfq/route.js
// Admin posts a public RFQ on behalf of a buyer (targetUserId), bypassing RLS
// via the service-role client. buyer_name/company_name are resolved server-side
// from the buyers row rather than trusting client input.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminRequest } from '@/lib/verifyAdmin';

export async function POST(request) {
  const { error: authError, status } = await verifyAdminRequest(request);
  if (authError) return NextResponse.json({ error: authError }, { status });

  try {
    const body = await request.json();
    const { targetUserId, title, category, quantity, targetPrice, details, incoterms } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId가 필요합니다.' }, { status: 400 });
    }

    const { data: buyer } = await supabaseAdmin
      .from('buyers')
      .select('buyer_name, company_name_en')
      .eq('auth_user_id', targetUserId)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('public_rfqs')
      .insert([{
        user_id: targetUserId,
        title: title || '',
        product_name: title || '',
        category: category || 'General Manufacturing',
        buyer_name: buyer?.buyer_name || 'Not specified',
        company_name: buyer?.company_name_en || 'Not specified',
        buyer_company_name: buyer?.company_name_en || 'Not specified',
        order_quantity: quantity || '',
        moq: quantity || '',
        target_price: targetPrice || '',
        details: details || '',
        incoterms: incoterms || 'FOB',
        quote_count: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ rfq: data });
  } catch (err) {
    console.error('admin create-rfq error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
