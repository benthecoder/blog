import React from 'react';

type ImageOnHoverProps = {
  text: string;
  imagePath: string;
  altText: string;
};

const ImageOnHover: React.FC<ImageOnHoverProps> = ({
  text,
  imagePath,
  altText,
}) => {
  return (
    <div className='hover-container'>
      {' '}
      <span className='relative group'>
        <span className='underline decoration-dotted cursor-pointer hover:decoration-solid'>
          {text}
        </span>
        <div className='absolute hidden group-hover:block -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-10 image-container'>
          <img src={imagePath} alt={altText} className='image-hover' />
        </div>
      </span>
    </div>
  );
};

const ChronologyPage = () => {
  return (
    <div>
      <div className='space-y-4'>
        <h2 className='text-2xl font-bold'>Life Chronology</h2>

        <div className='space-y-2'>
          <h3 className='text-xl'>2001</h3>
          <ul className='list-disc ml-5'>
            <li>
              born in{' '}
              <ImageOnHover text='KL' imagePath='/images/kl.jpg' altText='KL' />
            </li>
          </ul>
        </div>

        <div className='space-y-2'>
          <h3 className='text-xl'>2007</h3>
          <ul className='list-disc ml-5'>
            <li>started primary school</li>
            <li>discovered a new hobby</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChronologyPage;
