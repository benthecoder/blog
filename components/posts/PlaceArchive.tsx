"use client";
import dynamic from "next/dynamic";
import { type PlaceGroup } from "@/utils/content/travel";
import PostList from "./PostList";
const PlacesOverviewMap = dynamic(() => import("./PlacesOverviewMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 border border-line bg-paper-sunken"
      aria-label="Loading places map"
    />
  ),
});
function Branch({ place, depth = 0 }: { place: PlaceGroup; depth?: number }) {
  const Heading = `h${Math.min(depth + 2, 6)}` as
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";
  return (
    <section
      id={`place-${place.id}`}
      className={`scroll-mt-8 ${depth === 0 ? "border-t border-line pt-6 mb-10" : "border-l border-line pl-4 sm:pl-6 mt-6"}`}
    >
      <Heading
        className={
          depth === 0
            ? "mb-4 text-base font-bold text-primary"
            : "mb-3 text-sm text-accent"
        }
      >
        {place.label}{" "}
        <span className="text-xs font-normal text-muted">· {place.count}</span>
      </Heading>
      {place.posts.length > 0 && <PostList posts={place.posts} />}
      {place.children.map((child) => (
        <Branch key={child.id} place={child} depth={depth + 1} />
      ))}
    </section>
  );
}
export default function PlaceArchive({ groups }: { groups: PlaceGroup[] }) {
  return (
    <div>
      <p className="mb-4 text-sm text-muted">notes by place</p>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">nothing here yet</p>
      ) : (
        <>
          <PlacesOverviewMap groups={groups} />
          <nav
            aria-label="Place regions"
            className="my-6 flex flex-wrap gap-x-4 gap-y-2 text-sm"
          >
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#place-${group.id}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {group.label}
              </a>
            ))}
          </nav>
          {groups.map((group) => (
            <Branch key={group.id} place={group} />
          ))}
        </>
      )}
    </div>
  );
}
