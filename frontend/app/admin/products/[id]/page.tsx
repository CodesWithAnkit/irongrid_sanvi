import ProductDetailPageClient from "./ProductDetailPageClient";

// Exclude this dynamic route from static export
export function generateStaticParams(): Array<{ id: string }> { return [{ id: "1" }]; }

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetailPageClient id={params.id} />;
}