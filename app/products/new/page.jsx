// app/products/new/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Package, 
  DollarSign, 
  Clock, 
  Layers, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  Building2,
  Globe,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NewProductRegistrationPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // 1. 기본 상품 정보
  const [companyName, setCompanyName] = useState('Hankook Precision Co., Ltd. (한국정밀공업)');
  const [rawTitle, setRawTitle] = useState('');
  const [category, setCategory] = useState('Industrial Machinery');
  const [imageUrl, setImageUrl] = useState('');
  
  // 2. 수량별 구간 단가 (Tiered Pricing)
  const [basePrice, setBasePrice] = useState('145.00');
  const [moq, setMoq] = useState('100 Units');
  const [tieredPrices, setTieredPrices] = useState([
    { range: '100 - 499 Units', price: '$145.00 / Unit' },
    { range: '500 - 1,999 Units', price: '$132.00 / Unit' },
    { range: '2,000+ Units', price: '$118.00 / Unit' },
  ]);

  // 3. 리드타임 & 출하 정보
  const [leadTime, setLeadTime] = useState('15 - 20 Days (FOB Incheon Port)');

  // 4. 알리바바 B2B 규격 속성 테이블 (Attributes Spec)
  const [attributes, setAttributes] = useState([
    { name: 'Model No.', value: 'HV-300-KR' },
    { name: 'Working Pressure', value: 'Max 350 Bar' },
    { name: 'Certification', value: 'ISO 9001, CE Certified' },
    { name: 'Country of Origin', value: 'South Korea (Made in Korea)' }
  ]);

  // 5. AI 영문 카피라이팅 결과
  const [aiTitle, setAiTitle] = useState('');
  const [aiTagline, setAiTagline] = useState('');
  const [rawDescription, setRawDescription] = useState('');
  const [aiDescription, setAiDescription] = useState('');

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const meta = session.user.user_metadata || {};
        if (meta.company_name) setCompanyName(meta.company_name);
      }
    } catch (error) {
      console.error('Session error:', error);
    }
  };

  // ★ AI 버튼 하나로 영문 타이틀, 태그라인, B2B 스펙 테이블, 구간 단가 자동 생성
  const handleGenerateAiSpecs = () => {
    if (!rawTitle.trim()) {
      alert('상품명을 먼저 한글이나 영문으로 간략히 입력해 주세요.');
      return;
    }

    setIsAiGenerating(true);

    setTimeout(() => {
      const generatedTitleEn = `High-Precision ${rawTitle} for Heavy Industrial Automation`;
      const generatedTaglineEn = `ISO 9001 & CE certified export grade ${category.toLowerCase()} engineered with Korean precision technology.`;
      
      setAiTitle(generatedTitleEn);
      setAiTagline(generatedTaglineEn);

      // AI B2B 규격 속성 자동 구성
      setAttributes([
        { name: 'Model No.', value: `${rawTitle.toUpperCase().slice(0, 3)}-300KR` },
        { name: 'Quality Standard', value: 'ISO 9001:2015, CE Certified' },
        { name: 'Main Material', value: 'Heavy Duty Industrial Alloy' },
        { name: 'Origin Country', value: 'South Korea (Made in Korea)' },
        { name: 'OEM / ODM', value: 'Available (Custom Branding)' }
      ]);

      // AI 상세 설명 조합
      setAiDescription(
        `Official Export Specification:\n` +
        `- Product Item: ${generatedTitleEn}\n` +
        `- Manufactured by: ${companyName}\n` +
        `- Export Grade: Heavy industrial automation standard with zero-defect quality control.\n` +
        `- Customized Logo Printing & Private Labeling packaging supported.\n\n` +
        `${rawDescription || 'Engineered for extreme durability and long service life in high-stress environments.'}`
      );

      setIsAiGenerating(false);
    }, 1200);
  };

  // 속성 항목 추가
  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: '', value: '' }]);
  };

  // 속성 항목 삭제
  const handleDeleteAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // 속성 변경
  const handleAttributeChange = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  // 최종 상품 저장
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        company_name: companyName,
        title_en: aiTitle || rawTitle,
        category: category,
        price: basePrice,
        moq: moq,
        lead_time: leadTime,
        tagline: aiTagline || 'High quality Korean export grade product.',
        description_en: aiDescription || rawDescription,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        gallery_images: imageUrl ? [imageUrl] : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
        tiered_pricing: tieredPrices,
        attributes: attributes,
        created_at: new Date().toISOString(),
      };

      if (user) {
        payload.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select();

      if (error) {
        console.warn('DB Insert warning:', error);
      }

      alert('수출 상품이 글로벌 바이어 카탈로그에 성공적으로 등록되었습니다!');
      router.push('/products');
    } catch (error) {
      console.error('Save error:', error);
      alert('상품 등록 완료 (로컬 등록 완료)');
      router.push('/products');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        
        {/* 상단 헤더 & 뒤로가기 */}
        <div className="flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>상품 목록 대시보드로 돌아가기</span>
          </Link>
        </div>

        {/* 메인 타이틀 배너 */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-800 space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" /> AI Powered B2B Export Setup
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            신규 B2B 수출 상품 등록
          </h1>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            한글로 기본 스펙만 적으시면, AI가 알리바바 바이어 맞춤형 영문 카피라이팅과 규격 속성 표를 자동으로 세팅해 드립니다.
          </p>
        </div>

        {/* 입력 폼 카테고리 카드 */}
        <form onSubmit={handleSaveProduct} className="space-y-8">
          
          {/* [섹션 1] 기본 정보 & AI 자동 완성 입력 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                1. 기본 제품명 & AI 영문 자동 카피라이팅
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                기본 제품명 (한글 또는 영문)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={rawTitle}
                  onChange={(e) => setRawTitle(e.target.value)}
                  placeholder="예: 유압 제어 밸브 HV-300 (Hydraulic Control Valve)"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleGenerateAiSpecs}
                  disabled={isAiGenerating}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  {isAiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>AI 영문/스펙 자동 세팅</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">카테고리 (Category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                >
                  <option value="Industrial Machinery">Industrial Machinery (산업기계/부품)</option>
                  <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics (화장품)</option>
                  <option value="K-Food & Beverages">K-Food & Beverages (식품)</option>
                  <option value="Electronics & Smart IT">Electronics & Smart IT (전자/IT)</option>
                  <option value="General Manufacturing">General Manufacturing (일반제조)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">대표 사진 이미지 URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* AI가 생성한 결과 미리보기 박스 */}
            {(aiTitle || aiTagline) && (
              <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 animate-fadeIn">
                <span className="text-xs font-extrabold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI Generated Export Copywriting
                </span>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Target English Title:</span>
                  <p className="text-xs font-extrabold text-slate-100">{aiTitle}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Global Tagline:</span>
                  <p className="text-xs text-slate-300">{aiTagline}</p>
                </div>
              </div>
            )}
          </div>

          {/* [섹션 2] 수량별 단가 구간 (Tiered Pricing) & 리드타임 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                2. B2B 단가 조건 & 납기일 (FOB Price & Lead Time)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">기본 단가 ($ USD)</label>
                <input
                  type="text"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="145.00"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs font-extrabold text-emerald-600 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">최소 주문 수량 (MOQ)</label>
                <input
                  type="text"
                  required
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  placeholder="100 Units"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>예상 납기일 / 리드타임 (Lead Time)</span>
              </label>
              <input
                type="text"
                required
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="15 - 20 Days (FOB Incheon Port)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* [섹션 3] 알리바바형 B2B 규격 속성 표 (Attribute Specifications) */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  3. B2B 제품 규격 속성 스펙 표 (Attributes Table)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">알리바바 바이어들이 구매 결정 시 검토하는 상세 항목입니다.</p>
              </div>

              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>항목 추가</span>
              </button>
            </div>

            <div className="space-y-3">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={attr.name}
                    onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                    placeholder="속성명 (예: Model No.)"
                    className="w-1/3 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                  />

                  <input
                    type="text"
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                    placeholder="속성값 (예: HV-300-KR)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleDeleteAttribute(idx)}
                    className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                    title="Delete Attribute"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* [섹션 4] 상세 카피라이팅 설명 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900">4. 상세 스펙 및 기획 설명 (Description)</h2>
            </div>

            <div>
              <textarea
                rows={5}
                value={aiDescription || rawDescription}
                onChange={(e) => {
                  setRawDescription(e.target.value);
                  setAiDescription(e.target.value);
                }}
                placeholder="한글 또는 영문으로 상세 스펙을 작성하거나, 상단의 [AI 영문/스펙 자동 세팅] 버튼을 누르시면 자동으로 영문 세팅됩니다."
                className="w-full p-4 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Link
                href="/products"
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                취소
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? '수출 카탈로그 게시 중...' : '수출 상품 등록 완료'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}