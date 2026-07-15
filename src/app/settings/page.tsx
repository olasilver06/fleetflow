import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import ThemeToggle from "@/components/ThemeToggle";
import DeleteAccountControl from "@/components/settings/DeleteAccountControl";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-text-primary text-2xl font-medium">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your appearance and account.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-text-primary font-medium mb-1">Appearance</p>
          <p className="text-text-secondary text-sm mb-4">
            Switch between light and dark mode.
          </p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-text-secondary text-sm">Toggle theme</span>
          </div>
        </div>

        <div className="rounded-xl border border-danger/40 bg-danger/5 p-6">
          <p className="text-danger font-medium mb-1">Danger zone</p>
          <p className="text-text-secondary text-sm mb-4">
            Deleting your account removes your access immediately. This can only be reversed
            by an administrator.
          </p>
          <DeleteAccountControl />
        </div>
      </div>
    </main>
  );
}
