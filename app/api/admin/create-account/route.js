// app/api/admin/create-account/route.js
// Admin onboards a seller or buyer on their behalf: creates the auth user
// (no password — they set one via the "Forgot Password" flow on /login)
// plus the matching companies/buyers row, mirroring app/signup/profile/page.jsx.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminRequest } from '@/lib/verifyAdmin';

export async function POST(request) {
  const { error: authError, status } = await verifyAdminRequest(request);
  if (authError) return NextResponse.json({ error: authError }, { status });

  try {
    const body = await request.json();
    const { type, email, companyNameKo, companyNameEn, buyerName, country, category } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }
    if (type !== 'seller' && type !== 'buyer') {
      return NextResponse.json({ error: 'type은 seller 또는 buyer여야 합니다.' }, { status: 400 });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      email_confirm: true,
      user_metadata: {
        role: type,
        company_name: type === 'seller' ? (companyNameEn || companyNameKo) : companyNameEn,
        company_name_ko: companyNameKo || '',
        company_name_en: companyNameEn || '',
        buyer_name: type === 'buyer' ? buyerName : '',
        is_new_user: true
      }
    });
    if (createError) throw createError;

    const newUserId = created.user.id;

    if (type === 'seller') {
      const { error: companyError } = await supabaseAdmin.from('companies').insert([{
        user_id: newUserId,
        company_name: companyNameEn || companyNameKo || 'New Factory',
        company_name_ko: companyNameKo || '',
        company_name_en: companyNameEn || '',
        description: `Official Global B2B Showroom of ${companyNameEn || companyNameKo}.`,
        business_type: 'Direct Manufacturer',
        location: 'South Korea'
      }]);
      if (companyError) throw companyError;
    } else {
      const { error: buyerError } = await supabaseAdmin.from('buyers').insert([{
        auth_user_id: newUserId,
        buyer_name: buyerName || 'Global Buyer',
        company_name_en: companyNameEn || '',
        buyer_email: email.trim(),
        country: country || 'United States',
        interest_category: category || 'Industrial Machinery'
      }]);
      if (buyerError) throw buyerError;
    }

    return NextResponse.json({ userId: newUserId });
  } catch (err) {
    console.error('admin create-account error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
