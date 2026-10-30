import { JournalStream, journalMetadata } from "./JournalStream";

export const dynamic = "force-static";
export const metadata = journalMetadata(1);

export default function JournalPage() {
  return <JournalStream page={1} />;
}
