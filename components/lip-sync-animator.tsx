"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface LipSyncAnimatorProps {
  isActive: boolean;
  audioStream?: MediaStream;
  className?: string;
}

// Lightweight lip-sync animator that responds to actual audio
export function LipSyncAnimator({ isActive, audioStream, className }: LipSyncAnimatorProps) {
  const [volume, setVolume] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const rafIdRef = useRef<number>();

  // Initialize audio analyser if audio stream is provided
  useEffect(() => {
    if (!audioStream) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);

      analyser.fftSize = 256; // Small FFT size for performance
      source.connect(analyser);
      analyserRef.current = analyser;

      return () => {
        source.disconnect();
        analyser.disconnect();
        audioContext.close();
      };
    } catch (error) {
      console.warn('Could not initialize audio analyzer:', error);
    }
  }, [audioStream]);

  // Analyze audio and create lip sync animation
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isActive) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume (simple and fast)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    // Normalize to 0-1 range
    const normalizedVolume = Math.min(average / 50, 1); // Adjust sensitivity as needed
    setVolume(normalizedVolume);

    rafIdRef.current = requestAnimationFrame(analyzeAudio);
  }, [isActive]);

  // Start/stop audio analysis
  useEffect(() => {
    if (isActive && analyserRef.current) {
      analyzeAudio();
    } else {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      setVolume(0);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isActive, analyzeAudio]);

  // Simulated animation when no audio stream is available
  useEffect(() => {
    if (!audioStream && isActive) {
      let animationTime = 0;
      const animate = () => {
        animationTime += 0.016; // ~60fps
        // Create a realistic speaking pattern
        const simulatedVolume =
          Math.sin(animationTime * 8) * 0.3 + // Fast oscillation
          Math.sin(animationTime * 2) * 0.2 + // Medium oscillation
          Math.sin(animationTime * 0.5) * 0.1 + // Slow oscillation
          0.5; // Base level
        setVolume(Math.max(0, simulatedVolume));
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [audioStream, isActive]);

  if (!isActive) return null;

  return (
    <div className={`flex gap-1 items-end ${className}`}>
      {[...Array(5)].map((_, i) => {
        // Create varied heights based on volume and position
        const baseHeight = 8;
        const maxHeight = 20;
        const variation = Math.sin(i * 0.8) * 0.3; // Slight variation per bar
        const height = baseHeight + (maxHeight - baseHeight) * (volume + variation);

        return (
          <div
            key={i}
            className="w-1 bg-gradient-to-t from-pink-500 to-red-500 rounded-full transition-all duration-50"
            style={{
              height: `${height}px`,
              opacity: 0.6 + volume * 0.4,
              transform: `scaleY(${0.3 + volume * 0.7})`,
              transformOrigin: 'bottom',
            }}
          />
        );
      })}
    </div>
  );
}

// Very simple status indicator for minimal performance impact
export function AvatarStatusIndicator({ status }: { status: 'thinking' | 'speaking' | 'idle' }) {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm">
      {status === 'thinking' && (
        <>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
                style={{
                  animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-blue-300">Thinking</span>
        </>
      )}
      {status === 'speaking' && (
        <>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-300">Speaking</span>
        </>
      )}
    </div>
  );
}

// Performance monitoring component (optional)
export function AvatarPerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    const measureFPS = () => {
      frameCountRef.current++;
      const now = Date.now();

      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      requestAnimationFrame(measureFPS);
    };

    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
      FPS: {fps}
    </div>
  );
}