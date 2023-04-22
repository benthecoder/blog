import getPostContent from '../../../components/getPostContent';
import getPostMetadata from '../../../components/getPostMetadata';
import MarkdownRender from '../../../components/MarkdownRender';
import Link from 'next/link';

export const generateStaticParams = async () => {
  const posts = getPostMetadata();
  return posts.map((post) => ({
    slug: post.slug,
  }));
};

const PostPage = (props: any) => {
  const slug = props.params.slug;
  const post = getPostContent(slug);
  return (
    <div>
      <p className='font-bold text-left mb-10 text-lg'>{post.data.title}</p>
      <article className='prose'>
        <MarkdownRender content={post.content} />
        {/*<Markdown>{post.content}</Markdown>*/}
      </article>
      <div className='flex flex-row space-x-2 mt-10 text-slate-600'>
        {post.data.tags.split(', ').map((tag: any) => (
          <Link href={`/tags/${tag}`} key={tag}>
            #{tag}
          </Link>
        ))}
      </div>
      <p className='text-slate-400 mt-2'>{post.data.date}</p>
    </div>
  );
};

export default PostPage;
