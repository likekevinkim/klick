// components/products/RichSpecEditor.jsx
'use client';

import { Sparkles, Loader2, Bold, Italic, List, Heading, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';

export default function RichSpecEditor({ content, setContent, onGenerateAi, isAiGenerating }) {
  const handleInsertTag = (tagType) => {
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

    setContent(prev => prev + insertedText);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-1">
        <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
          4. Detailed Specifications Rich Editor
        </span>

        <button
          type="button"
          onClick={onGenerateAi}
          disabled={isAiGenerating}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
          <span>AI Auto-Generate Spec Sheet</span>
        </button>
      </div>

      <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-50 space-y-0">
        <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 flex-wrap text-slate-700">
          <button
            type="button"
            onClick={() => handleInsertTag('bold')}
            className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleInsertTag('italic')}
            className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleInsertTag('heading')}
            className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleInsertTag('list')}
            className="p-1.5 bg-white hover:bg-blue-50 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => handleInsertTag('image')}
            className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[10px]">Add Image</span>
          </button>

          <button
            type="button"
            onClick={() => handleInsertTag('video')}
            className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="text-[10px]">Add Video</span>
          </button>

          <button
            type="button"
            onClick={() => handleInsertTag('link')}
            className="p-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg border border-slate-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="text-[10px]">Add Link</span>
          </button>
        </div>

        <textarea
          rows={6}
          placeholder="자유롭게 제품 사양, 글, 이미지, 동영상 링크를 추가하세요. (AI 자동 생성 버튼을 누르면 영어 전문 카피가 자동 입력됩니다)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-4 text-xs font-mono leading-relaxed bg-white focus:outline-none"
        />
      </div>
    </div>
  );
}