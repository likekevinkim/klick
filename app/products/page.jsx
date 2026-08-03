// app/products/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { ExternalLink, Copy, Check, PlusCircle, Package, Loader2, AlertCircle, Building } from 'lucide-react';
import Link from 'next/link';

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '상품 목록을 불러오는 데 실패했습니다.');
        }

        setProducts(data);
      } catch (err) {
        console.error(err);
        setError(err.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // 바이어 공유용 링크 복사 기능
  const handleCopyLink = (id) => {
    const origin = window.location.origin;
    const shareUrl = `${origin}/products/${id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-8">
        {/* 상단 타이틀 섹션 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Export Product Dashboard
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
              등록된 수출 상품 대시보드
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              생성된 다국어 B2B 상세페이지 목록을 확인하고 해외 바이어에게 전달할 링크를 복사하세요.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>신규 상품 등록하기</span>
          </Link>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-24 space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-blue-600" />
            <p className="text-slate-600 font-semibold">등록된 상품 목록을 불러오고 있습니다...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-rose-700 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 상품 정보가 없을 경우 */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Package className="w-16 h-16 mx-auto text-slate-300 stroke-1" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">등록된 수출 상품이 없습니다</h3>
              <p className="text-slate-500 text-sm">한글로 제품 정보만 간단히 적으면 AI 영문 상세페이지가 생성됩니다.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition mt-2"
            >
              <PlusCircle className="w-4 h-4" /> 첫 상품 등록하러 가기
            </Link>
          </div>
        )}

        {/* 상품 카드 리스트 Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* 대표 사진 영역 */}
                  <div className="w-full h-48 bg-slate-100 border-b border-slate-100 flex items-center justify-center relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title_en}
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <div className="text-slate-400 text-xs font-medium">No Image Registered</div>
                    )}
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  {/* 카드 주요 내용 */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Building className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate">{item.company_name}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {item.title_en}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {item.tagline}
                    </p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs mt-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">FOB Price</span>
                        <span className="font-extrabold text-blue-600">${item.price}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">MOQ</span>
                        <span className="font-bold text-slate-700">{item.moq}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단 액션 버튼 그룹 */}
                <div className="p-6 pt-0 border-t border-slate-100 mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopyLink(item.id)}
                    className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>링크 복사</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/products/${item.id}`}
                    target="_blank"
                    className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>바이어 화면</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}