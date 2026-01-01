import { requireAdmin } from "@/lib/auth/guard";

export default async function SessionsLayout({
  children,
}: React.PropsWithChildren) {
  await requireAdmin();
  return <>{children}</>;
}
