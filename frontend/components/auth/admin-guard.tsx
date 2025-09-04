// Mock AdminGuard for testing
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}