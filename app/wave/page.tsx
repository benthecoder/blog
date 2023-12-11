import Image from 'next/image';

const Wave = () => {
  return (
    <div>
      <Image
        alt='wave'
        src='/images/wave.jpeg'
        quality={100}
        fill
        sizes='100vw'
        style={{
          objectFit: 'cover',
        }}
      />
    </div>
  );
};
export default Wave;
