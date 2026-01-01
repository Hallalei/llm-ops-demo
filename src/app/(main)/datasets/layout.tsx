import { requireAdmin } from "@/lib/auth/guard";

export default async function DatasetsLayout({
  children,
}: React.PropsWithChildren) {
  await requireAdmin();
  return <>{children}</>;
}
