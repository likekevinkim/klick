// lib/verifyAdmin.js
// Server-only helper shared by every /api/admin/* route: pull the bearer
// token, resolve it to a user via the service-role client, and confirm the
// email is in the admin allowlist. Import only from Route Handlers.
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ADMIN_EMAILS } from '@/lib/adminEmails';

export async function verifyAdminRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return { error: 'Missing authorization', status: 401 };

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user };
}
