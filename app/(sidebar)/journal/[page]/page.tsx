import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JournalStream,
  journalMetadata,
  journalPageCount,
} from "../JournalStream";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: journalPageCount() - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return journalMetadata(Number((await params).page));
}

export default async function JournalPageN({ params }: Props) {
  const page = Number((await params).page);
  if (!Number.isInteger(page) || page < 2 || page > journalPageCount())
    notFound();
  return <JournalStream page={page} />;
}
