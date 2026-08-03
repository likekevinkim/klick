// app/products/new/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Sparkles, CheckCircle2, Package, DollarSign, FileText, Loader2, AlertCircle, Upload, X, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterProductPage() {
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '기계/부품',
    price: '',
    moq: '',
    description: '',
    companyName: '',
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleFactor = MAX_WIDTH / img.width;
          
          if (scaleFactor < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleFactor;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setImagePreview(resizedBase64);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '상세페이지 생성에 실패했습니다.');
      }

      setGeneratedResult(data);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || '서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!generatedResult) return;
    setIsSaving(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/products/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          generatedResult,
          imagePreview,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      // 저장 성공 후 대시보드로 안전 이동
      window.location.href = '/products';
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <section className="bg-slate-900 text-white py-12 px-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> 목록 대시보드로 돌아가기
          </Link>
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/20 text-blue-400 text-sm font-semibold border border-blue-500/30">
              <Sparkles className="w-4 h-4" /> KLICK 제조사 입점 센터
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
              한글로 입력하면 <span className="text-blue-400">영문 글로벌 상세페이지</span>가 즉시 생성됩니다
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
              어려운 무역 영어 걱정 마세요. 제품 사진과 한국어 스펙만 간단히 적으면 AI가 바이어 맞춤형 영문 카피라이팅을 자동 기획합니다.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              제품 정보 및 사진 등록
            </h2>
            <p className="text-sm text-slate-500 mt-1">공장 사장님도 바로 작성할 수 있는 직관적인 항목입니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                제품 대표 사진 등록
              </label>
              {!imagePreview ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-700">사진 선택하기 (클릭)</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP 지원</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-48 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="제품 대표 이미지"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                회사명 / 제조사 이름
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="예: 한국정밀공업"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  제품명 (한글)
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="예: 고성능 유압 밸브"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  제품 카테고리
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition bg-white"
                >
                  <option value="기계/부품">기계 / 산업 부품</option>
                  <option value="화장품/뷰티">화장품 / K-뷰티</option>
                  <option value="식품/음료">식품 / K-푸드</option>
                  <option value="전자/IT">전자 / IT 기기</option>
                  <option value="기타">기타 제조업</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  희망 단가 (USD 달러 기준)
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="예: 50"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  최소 주문 수량 (MOQ)
                </label>
                <div className="relative">
                  <Package className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    name="moq"
                    value={formData.moq}
                    onChange={handleChange}
                    placeholder="예: 100개"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                제품 특장점 및 간단 설명
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="제품의 소재, 내구성, 주요 용도, 인증 정보 등을 편하게 작성해주세요."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition resize-none"
                required
              ></textarea>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>AI가 글로벌 상세페이지를 기획 중입니다...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>AI 영문 상세페이지 미리보기 생성</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[550px] flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  해외 바이어용 영문 페이지 미리보기
                </h2>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                  KLICK Standard
                </span>
              </div>

              {!generatedResult && !isGenerating && (
                <div className="text-center py-20 text-slate-400 space-y-3">
                  <FileText className="w-16 h-16 mx-auto stroke-1 text-slate-300" />
                  <p className="font-medium text-base">왼쪽 정보를 입력하고 사진을 등록하면<br />바이어 맞춤형 상세페이지가 생성됩니다.</p>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-24 space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
                  <p className="text-slate-600 font-semibold">
                    한국어 상품 정보를 B2B 전용 바이어 영문으로 변환하고 있습니다...
                  </p>
                </div>
              )}

              {generatedResult && !isGenerating && (
                <div className="space-y-6 animate-fadeIn">
                  {imagePreview && (
                    <div className="w-full h-64 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={imagePreview}
                        alt="Global Product"
                        className="w-full h-full object-contain bg-white"
                      />
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Product Title</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{generatedResult.titleEn}</h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{generatedResult.tagline}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-1">Product Overview</h4>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {generatedResult.overview}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Key Specifications</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                      {generatedResult.specs?.map((spec, idx) => (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-100">
                          <span className="text-slate-400 block text-[11px]">{spec.key}</span>
                          <span className="font-semibold text-slate-800">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Why Choose This Product</h4>
                    <ul className="space-y-2">
                      {generatedResult.sellingPoints?.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {generatedResult && (
              <div className="pt-6 border-t border-slate-100 mt-6">
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>DB에 저장하고 마켓플레이스로 이동 중...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      <span>상품 등록 완료 및 마켓플레이스 등록</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}