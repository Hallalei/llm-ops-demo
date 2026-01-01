import { requireAdmin } from "@/lib/auth/guard";

export default async function UsersLayout({
  children,
}: React.PropsWithChildren) {
  await requireAdmin();
  return <>{children}</>;
}
