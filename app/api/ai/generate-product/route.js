// app/api/ai/generate-product/route.js
import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const MODEL = 'gpt-5.4-mini';

const SYSTEM_PROMPT = `You are a professional B2B export copywriter for KLICK, a platform that connects Korean manufacturers with global buyers (similar to Alibaba).
Write in clear, confident, professional English aimed at international B2B sourcing buyers.
Never invent certifications, standards, or facts that were not provided to you — if information is missing, use general professional phrasing instead of making up specifics.
If the product title is given in Korean, translate it into a natural, professional English B2B product title rather than a literal word-for-word translation.`;

function buildContext(body) {
  const {
    titleKo = '',
    titleEn = '',
    category = '',
    companyName = '',
    factoryLocation = 'South Korea',
    certifications = '',
    moq = '',
    leadTime = '',
    attributes = [],
    detailsText = '',
  } = body;

  const attrLines = (attributes || [])
    .filter((a) => a?.name && a?.value)
    .map((a) => `- ${a.name}: ${a.value}`)
    .join('\n');

  return `
Product title (Korean, may be empty): ${titleKo || '(not provided)'}
Product title (English, may be empty): ${titleEn || '(not provided)'}
Category: ${category || '(not provided)'}
Manufacturer / Company: ${companyName || '(not provided)'}
Factory location: ${factoryLocation || 'South Korea'}
Certifications: ${certifications || '(not provided)'}
MOQ: ${moq || '(not provided)'}
Lead time: ${leadTime || '(not provided)'}
Existing spec notes from the seller (may be empty): ${detailsText || '(not provided)'}
Product attributes:
${attrLines || '(none provided)'}
`.trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode = 'summary', title } = body;
    const mainTitle = title || body.titleEn || body.titleKo;

    if (!mainTitle) {
      return NextResponse.json({ error: 'Product title is required.' }, { status: 400 });
    }

    const context = buildContext(body);

    if (mode === 'summary') {
      const { output } = await generateText({
        model: openai(MODEL),
        system: SYSTEM_PROMPT,
        output: Output.object({
          schema: z.object({
            summary: z
              .string()
              .describe('A 2-3 sentence buyer-facing summary shown at the top of the product page, highlighting the manufacturer, MOQ, lead time, and certifications when available.'),
          }),
        }),
        prompt: `Write the buyer-facing summary for this product:\n\n${context}`,
      });

      return NextResponse.json({ generatedText: output.summary });
    }

    // mode === 'full': generates title, tagline, and a full spec sheet
    const { output } = await generateText({
      model: openai(MODEL),
      system: SYSTEM_PROMPT,
      output: Output.object({
        schema: z.object({
          titleEn: z.string().describe('A professional, SEO-friendly English B2B product title.'),
          tagline: z.string().describe('A short punchy one-line tagline, under 12 words.'),
          specSheet: z
            .string()
            .describe(
              'A formatted, multi-section plain-text spec sheet for a B2B export product page, using these exact section headers on their own lines: "[Official B2B Export Specification]", "[Key Features & Advantages]" (3-4 bullet points starting with "• "), and "[Technical Specs Summary]". Use \\n for line breaks.'
            ),
        }),
      }),
      prompt: `Write the full export product detail page content for this product:\n\n${context}`,
    });

    return NextResponse.json({
      generatedText: output.specSheet,
      titleEn: output.titleEn,
      tagline: output.tagline,
    });
  } catch (error) {
    console.error('AI generate-product error:', error);
    return NextResponse.json(
      { error: error?.message || 'AI generation failed.' },
      { status: 500 }
    );
  }
}
