export default function AuthLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      {children}
    </div>
  );
}
