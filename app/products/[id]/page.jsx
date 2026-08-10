// app/products/[id]/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  Sparkles, 
  Package, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  X, 
  Loader2, 
  FileText,
  ShoppingBag,
  Star,
  Clock,
  Truck,
  Award,
  Layers,
  ExternalLink,
  ChevronRight,
  Video,
  Play,
  Upload,
  Image as ImageIcon,
  Plus,
  Bold,
  Italic,
  List,
  Heading,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwner, setIsOwner] = useState(true);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 대표 미디어 선택 상태
  const [selectedImage, setSelectedImage] = useState('');
  const [isVideoActive, setIsVideoActive] = useState(false);

  // 셀러 수정 모달 상태 (새로 만드는 폼과 100% 동일한 스펙 구조)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitleKo, setEditTitleKo] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editMoq, setEditMoq] = useState('');
  const [editLeadTime, setEditLeadTime] = useState('');
  const [editProductSize, setEditProductSize] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // 미디어 입력 형태 ('file' or 'url')
  const [editMediaInputType, setEditMediaInputType] = useState('file');
  const [editMainImageUrl, setEditMainImageUrl] = useState('');
  const [editGalleryImages, setEditGalleryImages] = useState([]);
  const [editVideoUrl, setEditVideoUrl] = useState('');

  // 수량별 구간 단가 (Tiered Pricing)
  const [editTieredPricing, setEditTieredPricing] = useState([
    { min_qty: '100 - 499 Units', price: '145.00' },
    { min_qty: '500 - 1,999 Units', price: '132.00' },
    { min_qty: '2,000+ Units', price: '118.00' }
  ]);

  const [saving, setSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // DOM 참조 (수정 모달 파일 업로더용)
  const editMainFileInputRef = useRef(null);
  const editGalleryFileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (productId) {
      initProductDetail();
    }
  }, [productId]);

  const initProductDetail = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      let foundProduct = null;
      if (productId && productId !== '1') {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (data) foundProduct = data;
      }

      if (!foundProduct) {
        foundProduct = {
          id: productId || '1',
          user_id: user?.id || 'sample_owner_id',
          company_name: 'Hankook Precision Co., Ltd. (한국정밀공업)',
          company_id: '1',
          title_en: 'High-Precision Hydraulic Control Valve HV-300 Heavy Duty',
          title_ko: '초고압 산업용 유압 제어 밸브 HV-300',
          category: 'Industrial Machinery',
          price: '145.00',
          moq: '100 Units',
          rating: 4.9,
          reviews_count: 28,
          lead_time: '15 - 20 Days (FOB Incheon Port)',
          product_size: '240 x 180 x 120 mm / 4.5kg',
          tagline: 'ISO 9001 & CE certified heavy-duty hydraulic valve engineered with Korean precision technology.',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          tiered_pricing: [
            { range: '100 - 499 Units', price: '$145.00 / Unit' },
            { range: '500 - 1,999 Units', price: '$132.00 / Unit' },
            { range: '2,000+ Units', price: '$118.00 / Unit' }
          ],
          attributes: [
            { name: 'Model No.', value: 'HV-300-KR' },
            { name: 'Working Pressure', value: 'Max 350 Bar (5,076 PSI)' },
            { name: 'Flow Rate', value: '120 L/min' },
            { name: 'Body Material', value: 'Ductile Iron GGG40 / Heavy Alloy' },
            { name: 'Operating Temp', value: '-20°C to +80°C' },
            { name: 'Certification', value: 'ISO 9001:2015, CE Certified' },
            { name: 'Country of Origin', value: 'South Korea (Made in Korea)' },
            { name: 'OEM / ODM', value: 'Available (Custom Logo & Packaging)' }
          ],
          description_en: `### Official Verified Export Specification Sheet
- **Product Name**: High-Precision Hydraulic Control Valve HV-300
- **Category**: Industrial Machinery
- **Quality Standard**: ISO 9001:2015, CE Certified
- **Lead Time**: 15 - 20 Days (FOB Incheon Port)

### Key Industrial Features
1. **High Durability Alloy**: Built with high-grade Korean forged alloy steel for extreme 350 Bar pressure.
2. **Zero-Defect Quality Assurance**: 100% factory pressure test report provided with bulk export shipments.
3. **OEM / ODM Customization**: Custom logo laser engraving and specialized export packaging available.`,
          image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          gallery_images: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
          ],
          created_at: new Date().toISOString(),
        };
      }

      setProduct(foundProduct);
      setSelectedImage(foundProduct.image_url);
      populateEditForm(foundProduct);
      setIsOwner(true);
    } catch (error) {
      console.error('Failed to load product detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 수정 모달에 기존 데이터 채우기
  const populateEditForm = (item) => {
    if (!item) return;
    setEditTitleKo(item.title_ko || item.title_en || '');
    setEditTitleEn(item.title_en || '');
    setEditCategory(item.category || 'Industrial Machinery');
    setEditMoq(item.moq || '100 Units');
    setEditLeadTime(item.lead_time || '15 - 20 Days (FOB)');
    setEditProductSize(item.product_size || '240 x 180 x 120 mm / 4.5kg');
    setEditTagline(item.tagline || '');
    setEditDescription(item.description_en || '');
    setEditMainImageUrl(item.image_url || '');
    setEditGalleryImages(item.gallery_images || [item.image_url]);
    setEditVideoUrl(item.video_url || '');

    if (item.tiered_pricing && item.tiered_pricing.length > 0) {
      setEditTieredPricing(
        item.tiered_pricing.map(t => ({
          min_qty: t.range || '100 Units',
          price: (t.price || '145.00').replace(/[^0-9.]/g, '')
        }))
      );
    }
  };

  // 수정용 파일 업로드 핸들러
  const handleEditMainFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setEditMainImageUrl(URL.createObjectURL(file));
  };

  const handleEditGalleryFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      setEditGalleryImages(prev => [...prev, ...newUrls]);
    }
  };

  // 수정용 구간 단가 관리
  const handleAddEditPriceTier = () => {
    setEditTieredPricing([...editTieredPricing, { min_qty: '5,000+ Units', price: '100.00' }]);
  };

  const handleRemoveEditPriceTier = (index) => {
    setEditTieredPricing(editTieredPricing.filter((_, idx) => idx !== index));
  };

  const handleEditPriceTierChange = (index, field, value) => {
    const updated = [...editTieredPricing];
    updated[index][field] = value;
    setEditTieredPricing(updated);
  };

  // 수정용 에디터 태그 주입
  const handleInsertEditEditorTag = (tagType) => {
    let insertedText = '';
    if (tagType === 'bold') insertedText = ' **Bold Spec Text** ';
    if (tagType === 'italic') insertedText = ' *Italic Text* ';
    if (tagType === 'heading') insertedText = '\n### Technical Specification Heading\n';
    if (tagType === 'list') insertedText = '\n- Specification Item 1\n- Specification Item 2\n';
    if (tagType === 'image') {
      const imgUrl = prompt('Enter Image URL to embed:', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80');
      if (imgUrl) insertedText = `\n![Product Image](${imgUrl})\n`;
    }
    if (tagType === 'video') {
      const vidUrl = prompt('Enter Video URL to embed:', 'https://www.w3schools.com/html/mov_bbb.mp4');
      if (vidUrl) insertedText = `\n[Video Embed: ${vidUrl}]\n`;
    }
    if (tagType === 'link') {
      const linkUrl = prompt('Enter Spec Link URL:', 'https://klick.trade');
      if (linkUrl) insertedText = ` [Download Spec PDF](${linkUrl}) `;
    }

    setEditDescription(prev => prev + insertedText);
  };

  // AI 재보정
  const handleRegenerateAi = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setEditTagline(`Global Export Grade ${editCategory} engineered with Korean precision technology.`);
      setEditDescription(`### Official Verified Export Specification Sheet
- **Product Name**: ${editTitleKo || editTitleEn}
- **Category**: ${editCategory}
- **Quality Standard**: ISO 9001:2015, CE Certified
- **Lead Time**: ${editLeadTime}

### Key Features
1. High durability material engineered for long-term industrial reliability.
2. 100% factory pressure tested before shipment.`);
      setIsAiGenerating(false);
    }, 1000);
  };

  // 수정 저장 핸들러
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updatedData = {
      ...product,
      title_en: editTitleEn || editTitleKo,
      title_ko: editTitleKo,
      category: editCategory,
      price: editTieredPricing[0]?.price || '145.00',
      moq: editMoq,
      lead_time: editLeadTime,
      product_size: editProductSize,
      tagline: editTagline,
      description_en: editDescription,
      image_url: editMainImageUrl,
      gallery_images: editGalleryImages,
      video_url: editVideoUrl,
      tiered_pricing: editTieredPricing.map(t => ({ range: t.min_qty, price: `$${t.price} / Unit` }))
    };

    try {
      if (product.id && product.id !== '1') {
        await supabase
          .from('products')
          .update({
            title_en: editTitleEn || editTitleKo,
            category: editCategory,
            price: editTieredPricing[0]?.price || '145.00',
            moq: editMoq,
            lead_time: editLeadTime,
            product_size: editProductSize,
            tagline: editTagline,
            description_en: editDescription,
            image_url: editMainImageUrl,
            gallery_images: editGalleryImages,
            video_url: editVideoUrl,
            tiered_pricing: editTieredPricing.map(t => ({ range: t.min_qty, price: `$${t.price} / Unit` }))
          })
          .eq('id', product.id);
      }

      setProduct(updatedData);
      setSelectedImage(editMainImageUrl || updatedData.image_url);
      alert('Product specifications successfully updated!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      setProduct(updatedData);
      setIsEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm('Are you sure you want to delete this product from your global catalog?')) return;
    try {
      if (product.id && product.id !== '1') {
        await supabase.from('products').delete().eq('id', product.id);
      }
      alert('Product deleted successfully.');
      router.push('/products');
    } catch (error) {
      console.error('Delete error:', error);
      router.push('/products');
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 antialiased">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-10">
        
        {/* 네비게이션 & 편집 버튼 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href="/products" className="hover:text-blue-600">Products Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 truncate max-w-[200px] md:max-w-none">{product?.category}</span>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  populateEditForm(product);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Product Specs</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading verified B2B product specifications...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* [좌측 1열]: 고화질 미디어 갤러리 */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-full h-80 md:h-96 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative group">
                {isVideoActive && product?.video_url ? (
                  <video src={product.video_url} controls autoPlay className="w-full h-full object-contain bg-black" />
                ) : selectedImage ? (
                  <img src={selectedImage} alt={product.title_en} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}

                <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Factory Product
                </span>
              </div>

              {/* 썸네일 & 비디오 선택 */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product?.video_url && (
                  <button
                    type="button"
                    onClick={() => setIsVideoActive(true)}
                    className={`w-16 h-16 rounded-xl border-2 transition flex-shrink-0 cursor-pointer bg-slate-900 flex flex-col items-center justify-center text-white space-y-0.5 ${
                      isVideoActive ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-700 opacity-80'
                    }`}
                  >
                    <Play className="w-5 h-5 text-rose-500 fill-rose-500" />
                    <span className="text-[9px] font-bold">Video</span>
                  </button>
                )}

                {(product.gallery_images || [product.image_url]).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsVideoActive(false);
                      setSelectedImage(img);
                    }}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition flex-shrink-0 cursor-pointer ${
                      !isVideoActive && selectedImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* [중앙 2열]: 품명, 평점, 구간 단가표 */}
            <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <Globe className="w-3.5 h-3.5" /> {product.category}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating || 4.9}</span>
                    <span className="text-slate-400 font-medium">({product.reviews_count || 28} Reviews)</span>
                  </div>
                </div>

                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {product.title_en}
                </h1>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {product.tagline}
                </p>
              </div>

              {/* 구간 단가표 */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Wholesale Tiered FOB Pricing
                </span>

                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800">
                  {(product.tiered_pricing || [
                    { range: '100 - 499 Units', price: `$${product.price}` },
                    { range: '500 - 1,999 Units', price: '$132.00' },
                    { range: '2,000+ Units', price: '$118.00' }
                  ]).map((tier, idx) => (
                    <div key={idx} className="p-2 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-0.5">
                      <span className="text-slate-400 text-[10px] block font-bold">{tier.range}</span>
                      <span className="text-emerald-400 font-extrabold text-xs md:text-sm">{tier.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Lead Time
                  </span>
                  <span className="font-extrabold text-slate-800">{product.lead_time || '15 - 20 Days'}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold block flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-blue-600" /> Minimum Order (MOQ)
                  </span>
                  <span className="font-extrabold text-slate-800">{product.moq}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/chat"
                  className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Direct Inquiry (RFQ)</span>
                </Link>

                <Link
                  href="/chat"
                  className="py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Request Sample Order</span>
                </Link>
              </div>
            </div>

            {/* [우측 3열]: 공급업체 프로필 */}
            <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 h-fit sticky top-28">
              <div className="border-b border-slate-100 pb-3 space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                  Verified Supplier
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 pt-1">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  {product.company_name}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-bold">Business Type:</span>
                  <span className="font-extrabold text-slate-800">Direct Manufacturer</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-bold">Location:</span>
                  <span className="font-bold text-slate-800">South Korea 🇰🇷</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 font-bold">Certifications:</span>
                  <span className="font-extrabold text-blue-600">ISO 9001, CE</span>
                </div>
              </div>

              <Link
                href={`/companies/${product.company_id || 1}`}
                className="w-full py-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Visit Official Factory Showroom</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* 3. 리치 포맷팅 본문 노출 */}
        {product && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    Product Attribute Specifications Table
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {(product.attributes || [
                    { name: 'Model No.', value: 'HV-300-KR' },
                    { name: 'Working Pressure', value: 'Max 350 Bar (5,076 PSI)' },
                    { name: 'Flow Rate', value: '120 L/min' },
                    { name: 'Body Material', value: 'Ductile Iron GGG40 / Heavy Alloy' },
                    { name: 'Operating Temp', value: '-20°C to +80°C' },
                    { name: 'Certification', value: 'ISO 9001:2015, CE Certified' },
                    { name: 'Country of Origin', value: 'South Korea (Made in Korea)' },
                    { name: 'OEM / ODM', value: 'Available (Custom Logo & Packaging)' }
                  ]).map((attr, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500 font-bold">{attr.name}</span>
                      <span className="font-extrabold text-slate-800">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Detailed Specification Sheet & Features
                  </h2>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-mono">
                  {product.description_en}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 h-fit">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                KLICK Safe Trade Guarantee
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Direct contact with verified South Korean factory team.</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Real-time multilingual AI chat translation.</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Instant Proforma Invoice (PI) issuance & escrow payment support.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ★ 등록 폼과 100% 동일한 기능의 고급 수정 모달 팝업 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Edit Product Specifications & Rich Media
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Modify pictures, video, tiered pricing, and rich description content.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-6">
              
              {/* 1. 기본 인포메이션 */}
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider block border-b pb-1">
                  1. Basic Product Information
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Title (Korean)</label>
                    <input
                      type="text"
                      value={editTitleKo}
                      onChange={(e) => setEditTitleKo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Title (English) *</label>
                    <input
                      type="text"
                      required
                      value={editTitleEn}
                      onChange={(e) => setEditTitleEn(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Industrial Machinery">Industrial Machinery</option>
                      <option value="K-Beauty & Cosmetics">K-Beauty & Cosmetics</option>
                      <option value="K-Food & Beverages">K-Food & Beverages</option>
                      <option value="Electronics & Smart IT">Electronics & Smart IT</option>
                      <option value="General Manufacturing">General Manufacturing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MOQ *</label>
                    <input
                      type="text"
                      required
                      value={editMoq}
                      onChange={(e) => setEditMoq(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Lead Time *</label>
                    <input
                      type="text"
                      required
                      value={editLeadTime}
                      onChange={(e) => setEditLeadTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions & Weight Specification</label>
                  <input
                    type="text"
                    value={editProductSize}
                    onChange={(e) => setEditProductSize(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. 수량별 구간 단가 수정 (Tiered Pricing) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                    2. Wholesale Tiered FOB Pricing ($ USD)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEditPriceTier}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Tier Range
                  </button>
                </div>

                <div className="space-y-2">
                  {editTieredPricing.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Range (e.g., 100 - 499 Units)"
                        value={tier.min_qty}
                        onChange={(e) => handleEditPriceTierChange(idx, 'min_qty', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <div className="flex items-center gap-1 w-32">
                        <span className="text-xs font-bold text-slate-500">$</span>
                        <input
                          type="text"
                          placeholder="Price"
                          value={tier.price}
                          onChange={(e) => handleEditPriceTierChange(idx, 'price', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-emerald-600"
                        />
                      </div>
                      {editTieredPricing.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditPriceTier(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 미디어 업로더 및 URL 관리 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                    3. Product Images & Demo Video
                  </span>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setEditMediaInputType('file')}
                      className={`px-2.5 py-1 rounded-md transition ${editMediaInputType === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      File Select
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMediaInputType('url')}
                      className={`px-2.5 py-1 rounded-md transition ${editMediaInputType === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Paste URL
                    </button>
                  </div>
                </div>

                {editMediaInputType === 'file' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Main Cover Image *</label>
                      <input
                        type="file"
                        ref={editMainFileInputRef}
                        accept="image/*"
                        onChange={handleEditMainFileChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => editMainFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-3 text-center cursor-pointer transition space-y-1"
                      >
                        {editMainImageUrl ? (
                          <div className="relative h-24 rounded-xl overflow-hidden border border-slate-200">
                            <img src={editMainImageUrl} alt="Main Cover" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-blue-600 mx-auto" />
                            <span className="text-xs font-extrabold text-slate-700 block">Click to Change Cover</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Gallery Photos</label>
                      <input
                        type="file"
                        ref={editGalleryFileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleEditGalleryFilesChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => editGalleryFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-3 text-center cursor-pointer transition space-y-1"
                      >
                        {editGalleryImages.length > 0 ? (
                          <div className="flex items-center gap-1.5 overflow-x-auto h-24">
                            {editGalleryImages.map((url, gIdx) => (
                              <div key={gIdx} className="w-16 h-full rounded-xl overflow-hidden border flex-shrink-0 relative">
                                <img src={url} alt={`Gallery ${gIdx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5 text-emerald-600 mx-auto" />
                            <span className="text-xs font-extrabold text-slate-700 block">Click to Add Photos</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Main Cover Image URL *</label>
                      <input
                        type="url"
                        value={editMainImageUrl}
                        onChange={(e) => setEditMainImageUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Factory Video URL (MP4 / Embed)</label>
                      <input
                        type="url"
                        placeholder="https://www.w3schools.com/html/mov_bbb.mp4"
                        value={editVideoUrl}
                        onChange={(e) => setEditVideoUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. AI 지원 및 리치 에디터 본문 수정 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                    4. Detailed Specifications Rich Editor
                  </span>

                  <button
                    type="button"
                    onClick={handleRegenerateAi}
                    disabled={isAiGenerating}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    <span>AI Enhance Copywriting</span>
                  </button>
                </div>

                {/* 에디터 툴바 */}
                <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50 space-y-0">
                  <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 flex-wrap text-slate-700">
                    <button
                      type="button"
                      onClick={() => handleInsertEditEditorTag('bold')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditEditorTag('italic')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditEditorTag('heading')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Heading className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditEditorTag('list')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-px h-4 bg-slate-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => handleInsertEditEditorTag('image')}
                      className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Add Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditEditorTag('video')}
                      className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Add Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsertEditEditorTag('link')}
                      className="p-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Add Link</span>
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-4 text-xs font-mono leading-relaxed bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}