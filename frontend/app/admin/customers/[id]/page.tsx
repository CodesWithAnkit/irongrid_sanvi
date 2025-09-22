import CustomerDetailPageClient from "./CustomerDetailPageClient";

// Exclude this dynamic route from static export
export function generateStaticParams(): Array<{ id: string }> { return [{ id: "cmfv7emkn000cnpd79f02wqir" }]; }

export default function Page({ params }: { params: { id: string } }) {
  return <CustomerDetailPageClient id={params.id} />;
}