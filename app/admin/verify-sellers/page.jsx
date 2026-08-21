import { redirect } from 'next/navigation';

export default function LegacyVerifySellersRedirect() {
  redirect('/admin/sellers');
}
