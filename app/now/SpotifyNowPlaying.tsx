"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Image from "next/image";
import Loader from "@/components/ui/Loader";

interface RecentTrack {
  title: string;
  artist: string;
  albumImageUrl: string;
  songUrl: string;
  playedAt: string;
}

interface RecentlyPlayedData {
  tracks: RecentTrack[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SpotifyNowPlaying() {
  const [isVisible, setIsVisible] = useState(false);

  const { data: recentlyPlayed, isLoading } = useSWR<RecentlyPlayedData>(
    "/api/spotify/recently-played",
    fetcher,
    { refreshInterval: 300000 }
  );

  useEffect(() => {
    if (recentlyPlayed) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [recentlyPlayed]);

  if (isLoading) {
    return (
      <div className="mt-8 pt-6 border-t border-japanese-shiraumenezu dark:border-dark-tag">
        <Loader text="loading music..." size="sm" />
      </div>
    );
  }

  if (!recentlyPlayed?.tracks?.length) return null;

  return (
    <div
      className={`mt-8 text-sm text-japanese-nezumiiro dark:text-japanese-ginnezu leading-relaxed transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="border-t border-japanese-shiraumenezu dark:border-dark-border pt-6">
        <p className="mb-3 text-xs opacity-60">♫ recent</p>
        <div className="flex flex-col gap-2.5">
          {recentlyPlayed.tracks.slice(0, 10).map((track, i) => (
            <a
              key={i}
              href={track.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 no-underline text-inherit hover:opacity-70 transition-opacity"
            >
              <span className="text-[11px] opacity-35 w-4 text-right shrink-0">
                {i + 1}
              </span>
              {track.albumImageUrl && (
                <Image
                  src={track.albumImageUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="not-prose rounded-sm opacity-90 shrink-0"
                  unoptimized
                />
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-medium truncate">
                  {track.title}
                </p>
                <p className="text-[11px] opacity-55 truncate">
                  {track.artist}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
