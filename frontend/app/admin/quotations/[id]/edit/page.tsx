import EditQuotationPageClient from "./EditQuotationPageClient";

// Exclude this dynamic route from static export
type PageParams = {
  params: Promise<{ id: string }>;
};
// export async function generateStaticParams(): Promise<Array<{ id: string }>> {
//   const base = process.env.BUILD_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
//   const token = process.env.BUILD_API_TOKEN; // service token set in CI
//   if (!base) throw new Error("Missing BUILD_API_BASE_URL/NEXT_PUBLIC_API_BASE_URL for static export");

//   const res = await fetch(`${base}/quotations?skip=0&take=1000`, {
//     headers: {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//     // no credentials/cookies here
//   });

//   console.log(res);

//   if (!res.ok) {
//     throw new Error(`Failed to fetch quotation IDs for static export: ${res.status}`);
//   }

//   const data = await res.json(); // must match your PaginatedQuotationResponse
//   return (data?.data ?? []).map((q: { id: string }) => ({ id: q.id }));
// }

export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  return [{ id: "cmfv7emkn000cnpd79f02wqir" }];
}

export default async function Page({ params }: PageParams) {
  return <EditQuotationPageClient id={(await params).id} />;
}
