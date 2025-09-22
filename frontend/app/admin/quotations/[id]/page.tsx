import QuotationDetailPageClient from "./QuotationDetailPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

// IMPORTANT: Do not use client hooks in server functions.
// Use the server-safe API function to fetch quotation IDs for static params.
export  async function generateStaticParams(): Promise<Array<{ id: string }>> {
    return [{ id: "cmfv7emkn000cnpd79f02wqir" }];
}

async function Page({ params }: PageProps) {
  return <QuotationDetailPageClient id={(await params).id} />;
}

export default Page;
