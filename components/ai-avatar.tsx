"use client";

import dynamic from "next/dynamic";

interface AIAvatarProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  text?: string;
  fullBackground?: boolean;
}

// Dynamically import the 3D avatar component to avoid SSR issues
const AIAvatar3D = dynamic(() => import("./ai-avatar-3d").then((mod) => mod.AIAvatar3D), {
  ssr: false,
  loading: () => (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-border">
      <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export function AIAvatar({ isThinking = false, isSpeaking = false, text, fullBackground = false }: AIAvatarProps) {
  return <AIAvatar3D isThinking={isThinking} isSpeaking={isSpeaking} text={text} fullBackground={fullBackground} />;
}
