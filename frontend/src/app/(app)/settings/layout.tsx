import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsNav } from '@/components/settings';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your organisation profile, team access, compliance catalogue, notifications, and audit trail."
        className="mb-2"
      />
      <SettingsNav />
      <div className="page-enter">{children}</div>
    </div>
  );
}
