import QuotationDetailPageClient from "./QuotationDetailPageClient";

interface PageProps {
  params: { id: string };
}

export const dynamic = 'force-static'
export function generateStaticParams(): Array<{ id: string }> { return []; }

export default function Page({ params }: PageProps) {
  return <QuotationDetailPageClient id={params.id} />;
}
