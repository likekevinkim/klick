// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// URL 뒤에 붙은 /rest/v1, 슬래시(/), 따옴표, 공백을 자동 파괴 및 정제하는 함수
const sanitizeSupabaseUrl = (url) => {
  if (!url) return 'https://placeholder.supabase.co';
  return url
    .trim()
    .replace(/^['"]|['"]$/g, '')          // 따옴표 제거
    .replace(/\/rest\/v1\/?$/i, '')        // 잘못 붙은 /rest/v1 완벽 제거
    .replace(/\/+$/, '');                  // 끝에 붙은 슬래시(/) 완벽 제거
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
const supabaseAnonKey = (rawKey || 'placeholder-key').trim().replace(/^['"]|['"]$/g, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});