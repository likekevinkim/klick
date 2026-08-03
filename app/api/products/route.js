// app/api/products/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(products || []);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '상품 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}