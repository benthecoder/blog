import React from 'react';

type TimelineEvent = {
  year: string;
  month?: string;
  day?: string;
  description: string;
  imagePath?: string;
  altText?: string;
};

type TimelineProps = {
  events: TimelineEvent[];
};

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  // Group events by year
  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.year]) {
      acc[event.year] = [];
    }
    acc[event.year].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className="space-y-10">
      {Object.entries(groupedEvents).map(([year, yearEvents]) => (
        <div key={year} className="group/year">
          <div className="flex gap-6 text-[#595857] dark:text-[#F3F3F3]">
            <div className="min-w-[70px] pt-0.5">
              <span className="text-sm opacity-50 tracking-wide transition-opacity group-hover/year:opacity-70">
                {year}
              </span>
            </div>
            <div className="flex-1 space-y-4 -mt-0.5">
              {yearEvents.map((event, index) => {
                const dateDetail = event.day && event.month
                  ? `${event.month} ${event.day}`
                  : event.month
                  ? event.month
                  : null;

                return (
                  <div key={index} className="flex gap-4 group/event">
                    {dateDetail ? (
                      <>
                        <div className="min-w-[90px] pt-0.5">
                          <span className="text-sm opacity-30 transition-opacity group-hover/event:opacity-50">
                            {dateDetail}
                          </span>
                        </div>
                        <div className="flex-1 leading-relaxed">
                          {event.imagePath ? (
                            <span className="hover-container">
                              <span className="relative group">
                                <span className="underline decoration-dotted cursor-pointer hover:decoration-solid decoration-[#E5E4E6] dark:decoration-[#91989C] underline-offset-4">
                                  {event.description}
                                </span>
                                <div className="absolute hidden group-hover:block -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-10 image-container">
                                  <img src={event.imagePath} alt={event.altText || event.description} className="image-hover" />
                                </div>
                              </span>
                            </span>
                          ) : (
                            event.description
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 leading-relaxed">
                        {event.imagePath ? (
                          <span className="hover-container">
                            <span className="relative group">
                              <span className="underline decoration-dotted cursor-pointer hover:decoration-solid decoration-[#E5E4E6] dark:decoration-[#91989C] underline-offset-4">
                                {event.description}
                              </span>
                              <div className="absolute hidden group-hover:block -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 z-10 image-container">
                                <img src={event.imagePath} alt={event.altText || event.description} className="image-hover" />
                              </div>
                            </span>
                          </span>
                        ) : (
                          event.description
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;