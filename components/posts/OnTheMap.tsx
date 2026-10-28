const OnTheMap = ({ places }: { places: { name: string; href: string }[] }) => {
  if (places.length === 0) return null;

  return (
    <div className="mt-8 text-xs">
      <p className="text-primary/60 mb-1">On the map</p>
      <ul className="space-y-1">
        {places.map((place) => (
          <li key={place.href}>
            <a
              href={place.href}
              className="text-primary hover:text-ink dark:hover:text-chalk-soft transition-colors"
            >
              {place.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnTheMap;
