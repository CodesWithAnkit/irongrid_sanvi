export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4">Admin Nav</aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
