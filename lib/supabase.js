// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// URL 및 Key 정제 함수 (공백, 따옴표, 끝부분 슬래시 완벽 제거)
const sanitizeUrl = (url) => {
  if (!url) return 'https://placeholder.supabase.co';
  return url
    .trim()
    .replace(/^['"]|['"]$/g, '')          // 따옴표 제거
    .replace(/\/rest\/v1\/?$/i, '')        // 잘못 붙은 /rest/v1 경로 제거
    .replace(/\/+$/, '');                  // 끝부분 슬래시(/) 제거
};

const sanitizeKey = (key) => {
  if (!key) return 'placeholder-anon-key';
  return key.trim().replace(/^['"]|['"]$/g, '');
};

const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = sanitizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});