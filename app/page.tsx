import ArtworkRotation from "@/components/ui/ArtworkRotation";

export const revalidate = 3600; // Cache for 1 hour

export default function HomePage() {
  return <ArtworkRotation />;
}
