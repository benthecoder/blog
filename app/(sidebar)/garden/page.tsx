import type { Metadata } from "next";
import Link from "next/link";
import Garden from "@/components/visualizations/Garden";

export const metadata: Metadata = {
  title: "garden",
  description: "Plant a garden with a pencil-drawn peony.",
};

export default function GardenPage() {
  return (
    <div>
      <h1 className="font-bold text-2xl mb-8">garden</h1>
      <Garden />
      <p className="mt-10 text-sm">
        <Link
          href="/sketch"
          className="text-ink dark:text-chalk underline underline-offset-4"
        >
          the original drawings
        </Link>
      </p>
    </div>
  );
}
