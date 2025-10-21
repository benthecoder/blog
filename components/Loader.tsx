import React from "react";

interface LoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loader({ text, size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-[6px] h-[6px]",
    md: "w-[7px] h-[7px]",
    lg: "w-[8px] h-[8px]",
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`flex items-center ${gapClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} rounded-[1px] bg-japanese-sumiiro dark:bg-japanese-shironezu animate-pulse`}
          style={{ animationDelay: "0ms", animationDuration: "1400ms" }}
        />
        <div
          className={`${sizeClasses[size]} rounded-[1px] bg-japanese-sumiiro dark:bg-japanese-shironezu animate-pulse`}
          style={{ animationDelay: "200ms", animationDuration: "1400ms" }}
        />
        <div
          className={`${sizeClasses[size]} rounded-[1px] bg-japanese-sumiiro dark:bg-japanese-shironezu animate-pulse`}
          style={{ animationDelay: "400ms", animationDuration: "1400ms" }}
        />
      </div>
      {text && (
        <p className="text-xs text-japanese-sumiiro/50 dark:text-japanese-shironezu/50 font-light">
          {text}
        </p>
      )}
    </div>
  );
}
