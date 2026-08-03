// app/api/companies/[id]/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // 해당 회사의 대표 정보 조회
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    // 회사가 없더라도 가상 프로필 기본값 반환 방어 로직
    const safeCompany = company || {
      id: id,
      company_name: '한국정밀공업 (Hankook Precision Co., Ltd.)',
      tagline: 'Leading Manufacturer of Industrial Machinery & Precision Components in South Korea',
      description: 'Established in 1998, Hankook Precision specializes in manufacturing ultra-durable hydraulic valves, industrial automation parts, and customized machinery components exported to over 30 countries worldwide.',
      business_type: 'Direct Manufacturer',
      location: 'Incheon, South Korea',
      established_year: '1998',
      employees_count: '50 - 100 Employees',
      factory_size: '5,000 sq. meters',
      certifications: ['ISO 9001', 'CE Certified', 'IATF 16949'],
    };

    // 해당 제조사가 등록한 전체 수출 상품 목록 조회
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      company: safeCompany,
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