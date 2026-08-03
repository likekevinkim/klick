// app/api/products/save/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { formData, generatedResult, imagePreview } = body;

    // 환경 변수 설정 검증
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!rawUrl || !rawKey || rawUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Supabase 연동 정보가 설정되지 않았습니다. .env.local 파일의 URL과 ANON KEY를 확인해 주세요.' },
        { status: 500 }
      );
    }

    if (!formData || !generatedResult) {
      return NextResponse.json(
        { error: '저장할 상품 정보가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // 전송받은 이미지 데이터 안전 가공
    const safeImageUrl = typeof imagePreview === 'string' && imagePreview.trim().length > 0 ? imagePreview : null;

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          company_name: formData.companyName || 'Unknown Manufacturer',
          product_name: formData.productName || 'Industrial Product',
          category: formData.category || '기계/부품',
          price: formData.price || '0',
          moq: formData.moq || '1',
          description: formData.description || '',
          image_url: safeImageUrl,
          title_en: generatedResult.titleEn || '',
          tagline: generatedResult.tagline || '',
          overview: generatedResult.overview || '',
          specs: generatedResult.specs || [],
          selling_points: generatedResult.sellingPoints || [],
        },
      ])
      .select();

    if (error) {
      console.error('Supabase DB Insert Error:', error);

      let detailMessage = error.message;
      if (error.code === '42P01') {
        detailMessage = 'Supabase DB에 products 테이블이 생성되지 않았습니다. Supabase SQL Editor에서 테이블 생성 쿼리를 실행해 주세요.';
      } else if (error.message?.includes('row-level security') || error.code === '42501') {
        detailMessage = 'Supabase 테이블 보안 정책(RLS)으로 인해 데이터 저장이 차단되었습니다. Supabase SQL Editor에서 "ALTER TABLE products DISABLE ROW LEVEL SECURITY;" 명령을 실행해 주세요.';
      }

      return NextResponse.json(
        { error: `Supabase 저장 실패: ${detailMessage}` },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '상품 저장 후 반환된 데이터가 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, product: data[0] });
  } catch (error) {
    console.error('Database Save Catch Error:', error);
    return NextResponse.json(
      { error: error.message || '데이터베이스 저장 중 처리 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}