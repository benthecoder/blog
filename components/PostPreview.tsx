import Link from 'next/link';
import { PostMetadata } from './PostMetadata';

const PostPreview = (props: PostMetadata) => {
  return (
    <Link href={`/posts/${props.slug}`}>
      <div className='flex justify-between items-center hover:bg-blue-100  dark:hover:bg-slate-700 cursor-crosshair hover:underline'>
        <p className='text-black dark:text-white'>{props.title}</p>
        <p className='text-slate-400'>{props.date}</p>
      </div>
    </Link>
  );
};

export default PostPreview;
