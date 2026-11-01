import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_COOKIE, verifyAdminSession } from "@/utils/adminAuth";
import ThoughtComposer from "@/components/thoughts/ThoughtComposer";

export const metadata: Metadata = {
  title: "write a thought",
  robots: { index: false, follow: false },
};

export default async function NewThoughtPage() {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.ADMIN_SECRET;
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!secret || !token || !verifyAdminSession(token, secret)) {
      redirect("/admin/login?next=%2Fthoughts%2Fnew");
    }
  }
  return (
    <section className="py-8 sm:py-12">
      <Link
        href="/thoughts"
        className="text-sm text-muted hover:text-accent underline underline-offset-4"
      >
        ← thoughts
      </Link>
      <h1 className="mt-8 text-3xl text-primary">write a thought</h1>
      <p className="mt-3 mb-8 text-sm text-muted">
        a passing thought, a link worth keeping, or something still taking
        shape.
      </p>
      <ThoughtComposer />
    </section>
  );
}
