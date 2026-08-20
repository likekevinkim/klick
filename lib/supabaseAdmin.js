// lib/supabaseAdmin.js
// Server-only Supabase client using the service-role key. NEVER import this
// from a 'use client' component or return anything it reads (like a user's
// email) in an API response — see the buyer/seller contact-info rule in
// project memory. Use it only inside Route Handlers, and only to do the one
// server-side thing the anon client can't (e.g. sending a notification).
import { createClient } from '@supabase/supabase-js';

const sanitizeUrl = (url) => {
  if (!url) return 'https://placeholder.supabase.co';
  return url.trim().replace(/^['"]|['"]$/g, '').replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
};

const sanitizeKey = (key) => (key ? key.trim().replace(/^['"]|['"]$/g, '') : '');

const supabaseUrl = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;
