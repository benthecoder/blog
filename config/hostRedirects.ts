const BLOG_HOST = "bneo.xyz";
const PHOTOS_HOST = "photos.bneo.xyz";
const MAPS_HOST = "maps.bneo.xyz";

const onHost = (value: string) => [{ type: "host" as const, value }];

const redirect = (source: string, destination: string, host: string) => ({
  source,
  destination,
  has: onHost(host),
  permanent: true,
});

// Photo pages live at the root of the photos host (photos.bneo.xyz/places).
const photoRedirects = (host: string) => [
  redirect("/photos", `https://${PHOTOS_HOST}`, host),
  redirect("/photos/:path*", `https://${PHOTOS_HOST}/:path*`, host),
];

// Directory names under app/(sidebar) that are real route segments.
export function blogSections(
  entries: { name: string; isDirectory(): boolean }[]
) {
  return entries
    .filter((e) => e.isDirectory() && !/^[([_]/.test(e.name))
    .map((e) => e.name)
    .sort();
}

// Each host serves only its own pages; the others 308 to their home host.
export function hostRedirects(sections: string[]) {
  const toBlog = (host: string) =>
    sections.flatMap((s) => [
      redirect(`/${s}`, `https://${BLOG_HOST}/${s}`, host),
      redirect(`/${s}/:path*`, `https://${BLOG_HOST}/${s}/:path*`, host),
    ]);

  return [
    ...photoRedirects(BLOG_HOST),
    redirect("/map", `https://${MAPS_HOST}`, BLOG_HOST),
    ...toBlog(PHOTOS_HOST),
    redirect("/map", `https://${MAPS_HOST}`, PHOTOS_HOST),
    ...toBlog(MAPS_HOST),
    ...photoRedirects(MAPS_HOST),
  ];
}
