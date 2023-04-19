import Link from 'next/link';
import { PostMetadata } from './PostMetadata';

const PostPreview = (props: PostMetadata) => {
  return (
    <div className='flex justify-between max-w-md'>
      <div>
        <Link href={`/posts/${props.slug}`}>
          <p className='hover:text-blue-600 underline items-start'>
            {props.title}
          </p>
        </Link>
      </div>

      <div className='text-slate-400 '>{props.date}</div>
    </div>
  );
};

export default PostPreview;
