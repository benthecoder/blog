import Link from 'next/link';
import { PostMetadata } from './PostMetadata';

const PostPreview = (props: PostMetadata) => {
  return (
    <Link href={`/posts/${props.slug}`}>
      <div className='flex justify-between items-center hover:bg-blue-100  cursor-crosshair hover:underline'>
        <p className='text-black'>{props.title}</p>
        <p className='text-slate-400'>{props.date}</p>
      </div>
    </Link>
  );
};

export default PostPreview;
