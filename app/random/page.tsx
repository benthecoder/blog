"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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

  return <p>Loading...</p>;
};

export default RandomPost;
