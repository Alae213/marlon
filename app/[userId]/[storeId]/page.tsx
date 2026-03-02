import { redirect } from "next/navigation";

export default async function StoreIndexPage({
  params,
}: {
  params: Promise<{ userId: string; storeId: string }>;
}) {
  const { userId, storeId } = await params;
  redirect(`/${userId}/${storeId}/products`);
}
