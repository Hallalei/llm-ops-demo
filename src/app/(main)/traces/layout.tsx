import { requireAdmin } from "@/lib/auth/guard";

export default async function TracesLayout({
  children,
}: React.PropsWithChildren) {
  await requireAdmin();
  return <>{children}</>;
}
