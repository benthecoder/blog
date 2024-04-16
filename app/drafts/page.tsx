import getPostMetadata from '../../utils/getPostMetadata';
import PostPreview from '../../components/PostPreview';

const DraftsPage = () => {
  const drafts = getPostMetadata(true);

  const draftPreviews = drafts.map((draft) => {
    return <PostPreview key={draft.slug} {...draft} />;
  });

  return (
    <div>
      <h1 className='font-bold text-left mb-6 text-2xl'>Drafts</h1>
      {draftPreviews}
    </div>
  );
};

export default DraftsPage;
