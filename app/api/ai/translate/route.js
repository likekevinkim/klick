// app/api/ai/translate/route.js
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const MODEL = 'claude-haiku-4-5';

export async function POST(request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ translatedText: text || '' });
    }

    if (!targetLang) {
      return NextResponse.json({ error: 'targetLang is required.' }, { status: 400 });
    }

    const { text: translatedText } = await generateText({
      model: anthropic(MODEL),
      system: `You are a professional translator for KLICK, a B2B trade chat platform connecting Korean sellers and global buyers. Translate the user's message into the language with ISO code "${targetLang}". Preserve tone, numbers, units, and product/company names. Output ONLY the translated text, with no quotes, labels, or explanations. If the text is already in that language, return it unchanged.`,
      prompt: text,
    });

    return NextResponse.json({ translatedText: translatedText.trim() });
  } catch (error) {
    console.error('AI translate error:', error);
    return NextResponse.json(
      { error: error?.message || 'Translation failed.' },
      { status: 500 }
    );
  }
}
