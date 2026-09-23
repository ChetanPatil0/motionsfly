import { SettingsClient } from "@/components/admin/settings-client";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsClient />
    </div>
  );
}
