import ArtworkRotation from "@/components/ui/ArtworkRotation";
import HomeIndex from "@/components/home/HomeIndex";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <ArtworkRotation />
      <HomeIndex />
    </>
  );
}
