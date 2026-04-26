import { Suspense } from "react";
import getPostMetadata from "@/utils/getPostMetadata";
import ArchiveClient from "@/components/archive/ArchiveClient";

export const dynamic = "force-static";

const ArchivePage = () => {
  const postMetadata = getPostMetadata();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArchiveClient allPosts={postMetadata} />
    </Suspense>
  );
};

export default ArchivePage;
