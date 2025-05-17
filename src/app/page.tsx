import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/dashboard');
  return null; // Redirect will handle rendering
}
