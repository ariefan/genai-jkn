"use client";

import { useEffect, useState } from "react";

interface AIAvatar3DProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  text?: string;
  fullBackground?: boolean;
}

export function AIAvatar3D({
  isThinking = false,
  isSpeaking = false,
  fullBackground = false
}: AIAvatar3DProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Your Ready Player Me avatar - using .png for 2D image
  const avatarImage = "https://models.readyplayer.me/68e71278fedc245300f49d27.png";

  useEffect(() => {
    // Preload image
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => {
      setImageError(true);
      setIsLoaded(true);
    };
    img.src = avatarImage;
  }, [avatarImage]);

  if (fullBackground) {
    // Full background avatar
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-3xl">
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 transition-opacity duration-1000 ${
            isSpeaking ? "opacity-100 animate-pulse" : "opacity-50"
          }`} />

          {/* Avatar Image */}
          {!imageError && isLoaded && (
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
              isSpeaking ? "scale-105 opacity-30" : isThinking ? "scale-100 opacity-20 animate-pulse" : "scale-95 opacity-15"
            }`}>
              <img
                src={avatarImage}
                alt="AI Avatar"
                className="h-full w-auto object-contain"
                style={{
                  filter: isSpeaking ? "drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))" : "none",
                }}
              />
            </div>
          )}

          {/* Thinking animation */}
          {isThinking && !isSpeaking && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <div className="flex gap-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500/50" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-purple-500/50" style={{ animationDelay: "200ms", animationDuration: "1s" }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-pink-500/50" style={{ animationDelay: "400ms", animationDuration: "1s" }} />
              </div>
            </div>
          )}

          {/* Speaking wave animation */}
          {isSpeaking && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
              <div className="flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 animate-pulse rounded-full bg-green-500/70"
                    style={{
                      height: `${20 + Math.sin(i * 0.5) * 15}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: "600ms",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Small avatar for messages
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-border shadow-lg">
      {!imageError && isLoaded && (
        <img
          src={avatarImage}
          alt="AI Avatar"
          className={`h-full w-full object-cover transition-all duration-300 ${
            isSpeaking ? "scale-110" : "scale-100"
          } ${isThinking ? "animate-pulse" : ""}`}
        />
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && isLoaded && (
        <div className="absolute bottom-0 right-0 flex gap-0.5 rounded-tl-lg bg-green-500/20 p-1 backdrop-blur-sm">
          <div className="h-2 w-0.5 animate-pulse bg-green-500" style={{ animationDelay: "0ms", animationDuration: "600ms" }} />
          <div className="h-2 w-0.5 animate-pulse bg-green-500" style={{ animationDelay: "200ms", animationDuration: "600ms" }} />
          <div className="h-2 w-0.5 animate-pulse bg-green-500" style={{ animationDelay: "400ms", animationDuration: "600ms" }} />
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && !isSpeaking && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0ms" }} />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "150ms" }} />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}
    </div>
  );
}
