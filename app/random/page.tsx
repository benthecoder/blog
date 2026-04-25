"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/ui/Loader";

const RandomPost = () => {
  const router = useRouter();

  useEffect(() => {
    const fetchRandomPostSlug = async () => {
      const response = await fetch("/api/random", { cache: "no-store" });
      const data = await response.json();
      router.push(`/posts/${data.slug}`);
    };

    fetchRandomPostSlug();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader />
    </div>
  );
};

export default RandomPost;
