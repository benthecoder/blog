import Link from 'next/link';
import { PostMetadata } from './PostMetadata';

const PostPreview = (props: PostMetadata) => {
  const isStarred = props.tags.includes('✰');

  return (
    <Link href={`/posts/${props.slug}`}>
      <div className="group relative flex justify-between items-center hover:bg-[#123524]/5 dark:hover:bg-[#1c4f36]/10 cursor-crosshair text-xs md:text-sm">
        {/* Title and optional star */}
        <div className="flex items-center gap-1">
          {isStarred && (
            <span className="text-[#123524] dark:text-[#1c4f36]">✰</span>
          )}
          <p
            className={`${
              isStarred
                ? 'font-medium text-[#123524] dark:text-[#1c4f36]'
                : 'text-black/90 dark:text-white/90'
            }`}
          >
            {props.title}
          </p>
        </div>

        {/* Date */}
        <p className="text-slate-400">{props.date}</p>
      </div>
    </Link>
  );
};

export default PostPreview;
