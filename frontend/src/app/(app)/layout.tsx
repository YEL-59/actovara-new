import { AppShell } from '@/components/layout/AppShell';

/** Authenticated area: every route in (app) gets the sidebar, top bar and demo banner. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
