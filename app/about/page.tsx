import React from 'react';
import Timeline from '../../components/Timeline';

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
  const timelineEvents = [
    {
      year: '2001',
      month: 'october',
      day: '28',
      description: 'born in KL',
      imagePath: '/images/kl.jpg',
      altText: 'KL'
    },
    {
      year: '2007',
      month: 'january',
      imagePath: '/images/munyee.jpeg',
      description: 'started primary school @ sjkc mun yee'
    },
    {
      year: '2018',
      month: 'november',
      description: 'graduated from Wesley Methodist School',
      imagePath: '/images/wesley.jpeg',
      altText: 'Wesley Methodist School KL'
    },
    {
      year: '2019',
      month: 'january',
      description: 'started college @ INTI Subang'
    },
    {
      year: '2020',
      month: 'april',
      description: 'COVID lockdown began'
    },
    {
      year: '2021',
      month: 'january',
      description: 'started online classes at ISU learning Java'
    },
    {
      year: '2021',
      month: 'august',
      description: 'flew to iowa with friends'
    },
    {
      year: '2022',
      month: 'january',
      description: 'started doing hackathons online'
    },
    {
      year: '2022',
      month: 'may',
      description: 'first summer internship at Tesla'
    },
    {
      year: '2023',
      month: 'may',
      description: 'second summer internship at Tesla'
    },
    {
      year: '2023',
      month: 'september',
      description: 'met T in ISU'
    },
    {
      year: '2023',
      month: 'december',
      description: 'graduated from Iowa State University'
    },
    {
      year: '2024',
      month: 'january',
      description: 'road trip from Iowa to Seattle'
    },
    {
      year: '2024',
      month: 'march',
      description: 'had surgery for GERD at iheal'
    },
    {
      year: '2024',
      month: 'april',
      description: 'bought a Fujifilm x100s'
    },
    {
      year: '2024',
      month: 'august',
      description: 'started masters in data science at University of San Francisco'
    },
    {
      year: '2024',
      month: 'december',
      description: 'started working at UCSF Health'
    },
    {
      year: '2025',
      month: 'june',
      description: 'won an award at AAPM 2025'
    },
    {
      year: '2025',
      month: 'july',
      description: 'my first big boy job in the US'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-2xl font-normal text-[#595857] dark:text-[#F3F3F3] mb-2">
            chronology
          </h1>
        </div>

        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
};

export default ChronologyPage;
