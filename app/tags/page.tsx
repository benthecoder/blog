import Link from 'next/link';
import getPostMetadata from '../../components/getPostMetadata';

const TagPage = () => {
  const postMetadata = getPostMetadata();

  const tags: { [index: string]: any } = {};

  postMetadata.forEach((post) => {
    post.tags.split(',').forEach((tag: any) => {
      tag = tag.trim();

      if (tags[tag]) {
        tags[tag] += 1;
      } else {
        tags[tag] = 1;
      }
    });
  });

  const sortedTags = Object.keys(tags).sort((a, b) => tags[b] - tags[a]);
  const tagList = sortedTags.map((tag) => (
    <div className='flex p-1 text-blue-800 space-x-1'>
      <Link href={`/tags/${tag}`}>{tag}</Link>
      <p className='text-slate-500'>({tags[tag]})</p>
    </div>
  ));

  return <div className='flex flex-wrap'>{tagList}</div>;
};

export default TagPage;
