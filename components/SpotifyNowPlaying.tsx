"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import Image from "next/image";
import Loader from "./Loader";

interface NowPlayingData {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
  duration_ms?: number;
  progress_ms?: number;
  progressPercent?: number;
  releaseYear?: string;
  trackNumber?: number;
  totalTracks?: number;
  popularity?: number;
}

interface RecentlyPlayedData {
  tracks: Array<{
    title: string;
    artist: string;
    album: string;
    albumImageUrl: string;
    songUrl: string;
    playedAt: string;
  }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SpotifyNowPlaying() {
  const [isVisible, setIsVisible] = useState(false);

  const { data: nowPlaying, isLoading: nowPlayingLoading } =
    useSWR<NowPlayingData>("/api/spotify/now-playing", fetcher, {
      refreshInterval: 60000,
    });

  const { data: recentlyPlayed, isLoading: recentlyPlayedLoading } =
    useSWR<RecentlyPlayedData>(
      !nowPlaying?.isPlaying ? "/api/spotify/recently-played" : null,
      fetcher,
      {
        refreshInterval: 300000,
      }
    );

  useEffect(() => {
    if (nowPlaying || recentlyPlayed) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [nowPlaying, recentlyPlayed]);

  const isLoading = nowPlayingLoading || recentlyPlayedLoading;

  if (isLoading) {
    return (
      <div className="mt-8 pt-6 border-t border-japanese-shiraumenezu dark:border-dark-tag">
        <Loader text="loading music..." size="sm" />
      </div>
    );
  }

  if (!nowPlaying && !recentlyPlayed) {
    return null;
  }

  return (
    <div
      className={`transition-opacity duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        marginTop: "32px",
        paddingLeft: "0px",
        paddingRight: "0px",
        fontSize: "14px",
        color: "#888888",
        lineHeight: "1.6",
      }}
    >
      <div
        style={{
          borderTop: "1px solid #e0e0e0",
          paddingTop: "24px",
        }}
      >
        {nowPlaying?.isPlaying ? (
          <div>
            <div
              style={{ marginBottom: "12px", fontSize: "12px", opacity: 0.6 }}
            >
              ♫ now
            </div>
            <div
              style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
            >
              {nowPlaying.albumImageUrl && (
                <a
                  href={nowPlaying.songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flexShrink: 0 }}
                >
                  <Image
                    src={nowPlaying.albumImageUrl}
                    alt=""
                    width={120}
                    height={120}
                    className="not-prose"
                    style={{
                      width: "120px",
                      height: "120px",
                      minWidth: "120px",
                      maxWidth: "120px",
                      borderRadius: "4px",
                      opacity: 0.95,
                    }}
                    unoptimized
                  />
                </a>
              )}
              <a
                href={nowPlaying.songUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    color: "#000000 !important" as any,
                    fontSize: "16px !important" as any,
                    opacity: "1 !important" as any,
                    visibility: "visible !important" as any,
                    marginBottom: "4px",
                    fontWeight: "500",
                  }}
                >
                  {nowPlaying.title}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    opacity: 0.6,
                  }}
                >
                  {nowPlaying.artist}
                  {nowPlaying.releaseYear && ` · ${nowPlaying.releaseYear}`}
                </div>
              </a>
            </div>
          </div>
        ) : recentlyPlayed?.tracks && recentlyPlayed.tracks.length > 0 ? (
          <div>
            <div
              style={{ marginBottom: "12px", fontSize: "12px", opacity: 0.6 }}
            >
              ♫ recent
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {recentlyPlayed.tracks.slice(0, 3).map((track, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                  }}
                >
                  {track.albumImageUrl && (
                    <a
                      href={track.songUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flexShrink: 0 }}
                    >
                      <Image
                        src={track.albumImageUrl}
                        alt=""
                        width={80}
                        height={80}
                        className="not-prose"
                        style={{
                          width: "80px",
                          height: "80px",
                          minWidth: "80px",
                          maxWidth: "80px",
                          borderRadius: "4px",
                          opacity: 0.9,
                        }}
                        unoptimized
                      />
                    </a>
                  )}
                  <a
                    href={track.songUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        color: "#000000 !important" as any,
                        fontSize: "14px !important" as any,
                        opacity: "1 !important" as any,
                        visibility: "visible !important" as any,
                        marginBottom: "3px",
                      }}
                    >
                      {track.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.6,
                      }}
                    >
                      {track.artist}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
