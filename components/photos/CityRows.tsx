import Link from "next/link";
import type { placeTree } from "@/utils/photoPlaces";
import { FadeImage } from "./FadeImage";

type Country = ReturnType<typeof placeTree>[number];

const frames = (n: number) => `${n} ${n === 1 ? "frame" : "frames"}`;

// One row per city: name and count, then a strip of its latest frames.
export function CityRows({ country }: { country: Country }) {
  return (
    <div className="ph-cities">
      {country.cities.map((city) => (
        <Link
          key={city.slug}
          href={`/places/${country.slug}/${city.slug}`}
          className="ph-city"
        >
          <div>
            <h3>{city.city}</h3>
            <p className="ph-mono">{frames(city.count)}</p>
          </div>
          <div className="ph-strip">
            {city.photos.slice(0, 6).map((photo) => (
              <div
                key={photo.id}
                style={{ aspectRatio: photo.width / photo.height }}
              >
                <FadeImage
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 25vw, 200px"
                  quality={60}
                />
              </div>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
