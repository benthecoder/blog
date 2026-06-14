import { Suspense } from "react";
import getPostMetadata from "@/utils/getPostMetadata";
import ArchiveClient from "./ArchiveClient";

export const dynamic = "force-static";

const ArchivePage = () => {
  const postMetadata = getPostMetadata();

  return (
    <Suspense fallback={null}>
      <ArchiveClient allPosts={postMetadata} />
    </Suspense>
  );
};

export default ArchivePage;
