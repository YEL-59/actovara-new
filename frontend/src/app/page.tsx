import { redirect } from 'next/navigation';

/** Entry point → dashboard. Signed-out users are sent on to /login by the AppShell guard. */
export default function HomePage() {
  redirect('/dashboard');
}
