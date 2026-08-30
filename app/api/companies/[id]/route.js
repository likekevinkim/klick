// app/api/companies/[id]/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', company.user_id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      company,
      products: products || [],
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '회사 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
