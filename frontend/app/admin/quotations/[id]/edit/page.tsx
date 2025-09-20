import EditQuotationPageClient from "./EditQuotationPageClient";

// Exclude this dynamic route from static export
export const dynamic = 'error';
export function generateStaticParams(): Array<{ id: string }> { return []; }

export default function Page() {
  return <EditQuotationPageClient />;
}
