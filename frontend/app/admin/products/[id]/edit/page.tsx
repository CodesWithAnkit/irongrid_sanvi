import EditProductPageClient from "./EditProductPageClient";

// Exclude this dynamic route from static export
export function generateStaticParams(): Array<{ id: string }> { return [{ id: "1" }]; }

export default function Page({ params }: { params: { id: string } }) {
  return <EditProductPageClient id={params.id} />;
}