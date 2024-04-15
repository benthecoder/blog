import getPostMetadata from '../../utils/getPostMetadata';
import PostPreview from '../../components/PostPreview';
import Link from 'next/link';

export default function DraftsPage() {
  const draftsMetadata = getPostMetadata(true);

  const draftPreviews = draftsMetadata.map((draft) => {
    return <PostPreview key={draft.slug} {...draft} />;
  });

  return (
    <div>
      <h1 className='font-bold text-left mb-6 text-2xl'>Drafts</h1>
      {draftPreviews}
    </div>
  );
}
