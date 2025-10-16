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
    <span className='relative group inline-block'>
      <span className='underline decoration-dotted cursor-pointer hover:decoration-solid'>
        {text}
      </span>
      <div className='absolute hidden group-hover:flex left-1/2 -translate-x-1/2 bottom-full pb-2 z-50 pointer-events-none'>
        <img src={imagePath} alt={altText} className='image-hover' />
      </div>
    </span>
  );
};

const ChronologyPage = () => {
  const timelineEvents = [
    {
      year: '2001',
      month: 'october',
      day: '28',
      description: 'born in KL',
      imageLinks: [
        { text: 'KL', imagePath: '/images/kl.jpg', altText: 'KL' }
      ]
    },
    {
      year: '2011',
      month: 'november',
      description: 'got obsessed with ping pong',
      imageLinks: [
        { text: 'ping pong', imagePath: '/images/pingpong.jpeg', altText: 'sjkc mun yee' }
      ]
    },
    {
      year: '2013',
      month: 'january',
      description: 'graduated from sjkc mun yee',
      imageLinks: [
        { text: 'graduated', imagePath: '/images/primarygrad.jpeg', altText: 'graduate' },
        { text: 'sjkc mun yee', imagePath: '/images/munyee.jpeg', altText: 'sjkc mun yee' }
      ]
    },
    {
      year: '2018',
      month: 'november',
      description: 'graduated from wmskl(i)',
      imageLinks: [
        { text: 'wmskl(i)', imagePath: '/images/wesley.jpeg', altText: 'Wesley Methodist School KL' }
      ]
    },
    {
      year: '2019',
      month: 'january',
      description: 'started college @ INTI Subang'
    },
    {
      year: '2020',
      month: 'april',
      description: 'covid lockdown'
    },
    {
      year: '2021',
      month: 'january',
      description: 'started online classes with isu'
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
      day: '19',
      description: 'bought a bike',
      imageLinks: [
        { text: 'bike', imagePath: '/images/mybike.jpg', altText: 'my bike' }
      ]
    },
    {
      year: '2022',
      month: 'may',
      day: '23',
      description: 'joined Tesla',
      imageLinks: [
        { text: 'Tesla', imagePath: '/images/tesla2022.jpg', altText: 'Tesla 2022' }
      ]
    },
    {
      year: '2022',
      month: 'june',
      day: '13',
      description: 'got high',
      imageLinks: [
        { text: 'high', imagePath: '/images/gothigh.jpg', altText: 'got high' }
      ]
    },
    {
      year: '2023',
      month: 'april',
      day: '14',
      description: 'first poster presentation',
      imageLinks: [
        { text: 'poster presentation', imagePath: '/images/weppr.jpeg', altText: 'University of Wisconsin statistics research presentation' }
      ]
    },
    {
      year: '2023',
      month: 'may',
      description: 'second summer internship at Tesla'
    },
    {
      year: '2023',
      month: 'august',
      day: '29',
      description: 'met T'
    },
    {
      year: '2023',
      month: 'september',
      description: 'visited the 6ix',
      imageLinks: [
        { text: '6ix', imagePath: '/images/torontopic.jpeg', altText: 'toronto' }
      ]
    },
    {
      year: '2023',
      month: 'november',
      day: '13',
      description: 'first football game',
      imageLinks: [
        { text: 'football game', imagePath: '/images/isugame.jpeg', altText: 'ISU football game' }
      ]
    },
    {
      year: '2023',
      month: 'december',
      description: 'graduated from Iowa State University'
    },
    {
      year: '2024',
      month: 'january',
      description: 'saw the wave art at seattle museum',
      imageLinks: [
        { text: 'wave art', imagePath: '/images/waveseattle.jpeg', altText: 'wave art' }
      ]
    },
    {
      year: '2024',
      month: 'march',
      description: 'had surgery for GERD at iheal',
      imageLinks: [
        { text: 'surgery', imagePath: '/images/surgery.jpeg', altText: 'iheal' }
      ]
    },
    {
      year: '2024',
      month: 'april',
      description: 'bought a third hand Fujifilm x100s',
      imageLinks: [
        { text: 'Fujifilm x100s', imagePath: '/images/x100s.jpeg', altText: 'Fujifilm x100s' }
      ]
    },
    {
      year: '2024',
      month: 'august',
      description: 'moved to sf for masters @ usf',
      imageLinks: [
        { text: 'sf', imagePath: '/images/transamerica.jpeg', altText: 'USF' }
      ]
    },
    {
      year: '2024',
      month: 'december',
      description: 'started researching @ ucsf',
      imageLinks: [
        { text: 'ucsf', imagePath: '/images/ucsf.jpeg', altText: 'UCSF Health' }
      ]
    },
    {
      year: '2025',
      month: 'march',
      day: '12',
      description: 'joined contrary research fellowship',
    },
    {
      year: '2025',
      month: 'march',
      day: '15',
      description: 'organized a hackathon for chinatown',
    },
    {
      year: '2025',
      month: 'april',
      day: '16',
      description: 'volunteered at golden gate park',
      imageLinks: [
        { text: 'golden gate park', imagePath: '/images/volunteerggp.jpeg', altText: 'volunteering at golden gate park' }
      ]
    },
    {
      year: '2025',
      month: 'may',
      day: '16',
      description: 'grad from usf',
      imageLinks: [
        { text: 'grad', imagePath: '/images/grad.jpeg', altText: 'AAPM 2025' }
      ]
    },
    {
      year: '2025',
      month: 'july',
      day: '27',
      description: 'presented @ aapm 2025',
      imageLinks: [
        { text: 'aapm 2025', imagePath: '/images/aapm.jpeg', altText: 'AAPM 2025' }
      ]
    },
    {
      year: '2025',
      month: 'july',
      day: '30',
      description: 'first day @ oe'
    }
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-2xl font-normal text-[#595857] dark:text-[#F3F3F3] mb-2">
            my life made up of small, meaningful moments
          </h1>
        </div>

        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
};

export default ChronologyPage;
