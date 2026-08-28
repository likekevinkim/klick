// app/api/admin/cert-url/route.js
// Issues a short-lived signed URL for a seller's private business-reg cert.
// Must run server-side with the service-role client — the anon-key client
// used directly from app/admin/sellers/page.jsx would let any logged-in user
// who copies the same call in devtools read another seller's cert.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdminRequest } from '@/lib/verifyAdmin';

export async function POST(request) {
  const { error: authError, status } = await verifyAdminRequest(request);
  if (authError) return NextResponse.json({ error: authError }, { status });

  try {
    const { path } = await request.json();
    if (!path) {
      return NextResponse.json({ error: 'path가 필요합니다.' }, { status: 400 });
    }

    const bucket = path.startsWith('http') ? 'company-images' : 'company-private-docs';
    const objectPath = path.startsWith('http') ? path.split('/').slice(-2).join('/') : path;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(objectPath, 300);
    if (error) throw error;

    return NextResponse.json({ signedUrl: data?.signedUrl || null });
  } catch (err) {
    console.error('admin cert-url error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
