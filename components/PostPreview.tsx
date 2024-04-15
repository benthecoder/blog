import Link from 'next/link';
import { PostMetadata } from './PostMetadata';

const PostPreview = (props: PostMetadata) => {
  const isStarred = props.tags.includes('✰');

  return (
    <Link href={`/posts/${props.slug}`}>
      <div className='flex justify-between items-center hover:bg-blue-100 dark:hover:bg-slate-700 cursor-crosshair hover:underline text-xs md:text-sm'>
        <p
          className={`${
            isStarred ? 'font-bold' : 'text-black'
          } dark:text-white`}
        >
          {isStarred && '✰'} {props.title}
        </p>
        <p className='text-slate-400'>{props.date}</p>
      </div>
    </Link>
  );
};

export default PostPreview;
