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
    {
      refreshInterval: 300000,
    }
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
      className={`transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        marginTop: "32px",
        fontSize: "14px",
        color: "#888888",
        lineHeight: "1.6",
      }}
    >
      <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "24px" }}>
        <div style={{ marginBottom: "12px", fontSize: "12px", opacity: 0.6 }}>
          ♫ recent
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentlyPlayed.tracks.slice(0, 10).map((track, i) => (
            <a
              key={i}
              href={track.songUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  opacity: 0.35,
                  width: "16px",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              {track.albumImageUrl && (
                <Image
                  src={track.albumImageUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="not-prose"
                  style={{
                    width: "40px",
                    height: "40px",
                    minWidth: "40px",
                    borderRadius: "3px",
                    opacity: 0.9,
                  }}
                  unoptimized
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {track.title}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    opacity: 0.55,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {track.artist}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
