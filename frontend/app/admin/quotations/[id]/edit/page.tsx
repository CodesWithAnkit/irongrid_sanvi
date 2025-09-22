import EditQuotationPageClient from "./EditQuotationPageClient";

// Exclude this dynamic route from static export

export function generateStaticParams(): Array<{ id: string }> { return [{ id: "1" }]; }

export default function Page({ params }: { params: { id: string } }) {
  return <EditQuotationPageClient id={params.id} />;
}
