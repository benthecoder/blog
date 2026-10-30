import { redirect } from "next/navigation";

export default async function StreamPage({
  searchParams,
}: {
  searchParams: Promise<{ camera?: string }>;
}) {
  const { camera } = await searchParams;
  redirect(camera ? `/?camera=${encodeURIComponent(camera)}` : "/");
}
