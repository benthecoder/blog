import getPostMetadata from "@/utils/getPostMetadata";
import ArchiveClient from "@/components/ArchiveClient";

const ArchivePage = () => {
  const postMetadata = getPostMetadata();

  return <ArchiveClient allPosts={postMetadata} />;
};

export default ArchivePage;
