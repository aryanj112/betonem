"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-24 h-24 text-2xl",
};

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  const showFallback = !src || imgError;

  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center overflow-hidden",
        sizeMap[size],
        className
      )}
    >
      {showFallback ? (
        fallback ? (
          <span className="font-semibold text-muted-foreground">
            {fallback.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <User className="w-1/2 h-1/2 text-muted-foreground" />
        )
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}

