import { Suspense } from "react";
import { getPostMetadata } from "@/utils/content/posts";
import ArchiveClient from "./ArchiveClient";

export const dynamic = "force-static";

const ArchivePage = () => {
  // The archive needs individual entries, not each entry's linked navigation graph.
  const postMetadata = getPostMetadata().map((post) => ({
    ...post,
    prev: null,
    next: null,
  }));

  return (
    <Suspense fallback={null}>
      <ArchiveClient allPosts={postMetadata} />
    </Suspense>
  );
};

export default ArchivePage;
