import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { UserNav } from "@/components/layouts/user-nav";
import { AuthProvider } from "@/components/providers/auth-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export default async function MainLayout({
  children,
}: React.PropsWithChildren) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 size-9" />
          <UserNav user={session.user} />
        </header>
        <main className="flex-1 p-4">
          <AuthProvider role={session.user.role}>{children}</AuthProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
