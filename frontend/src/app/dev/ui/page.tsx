import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UiGallery } from './UiGallery';

export const metadata: Metadata = { title: 'UI kit', robots: { index: false } };

/** Developer-only component gallery. Enable in production with NEXT_PUBLIC_ENABLE_UI_KIT=true. */
export default function UiKitPage() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_UI_KIT !== 'true') notFound();
  return <UiGallery />;
}
