import { requireSuperAdmin } from "@/lib/auth/guard";
import { SettingsContent } from "./_components/settings-content";

export default async function SettingsPage() {
  await requireSuperAdmin();

  return <SettingsContent />;
}
