// app/api/generate/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { productName, category, price, moq, description, companyName } = body;

    // AI 생성 로딩 연출 시뮬레이션 (1초)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // B2B 전용 표준 영문 생성 결과 (Mock Data)
    const mockResult = {
      titleEn: `[Export Grade] High-Performance Premium ${productName || 'Industrial Equipment'}`,
      tagline: 'Engineered with Korean Precision for Global B2B Supply Chains',
      overview: description
        ? `Professional Korean manufacturing standard: ${description} Built specifically for international partners requiring high durability and verified quality control.`
        : 'Top-tier Korean manufactured product designed for global business buyers seeking durability, precision, and reliable long-term supply.',
      specs: [
        { key: 'Product Name', value: productName || 'Custom Industrial Unit' },
        { key: 'Category', value: category || 'Industrial Supplies' },
        { key: 'FOB Price', value: `$${price || 'Negotiable'} / Unit` },
        { key: 'Min. Order Qty (MOQ)', value: `${moq || '100'} Units` },
        { key: 'Manufacturer', value: companyName || 'KLICK Certified Partner' },
        { key: 'Country of Origin', value: 'Republic of Korea' },
      ],
      sellingPoints: [
        'Direct Korean factory shipment with strict ISO quality management',
        'High operational durability and optimized packaging for international freight',
        'Dedicated 24/7 B2B technical support and RFQ inquiry response',
      ],
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '시뮬레이션 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}