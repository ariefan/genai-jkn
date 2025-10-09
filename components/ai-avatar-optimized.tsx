"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AIAvatarOptimizedProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  text?: string;
  fullBackground?: boolean;
}

// Performance-optimized avatar with lightweight animations
export function AIAvatarOptimized({
  isThinking = false,
  isSpeaking = false,
  fullBackground = false
}: AIAvatarOptimizedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentState, setCurrentState] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Your Ready Player Me avatar
  const avatarImage = "https://models.readyplayer.me/68e71278fedc245300f49d27.png";

  // Debounced state updates to prevent excessive re-renders
  const updateState = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current > 100) { // 100ms debounce
      lastUpdateRef.current = now;
      if (isSpeaking) {
        setCurrentState('speaking');
      } else if (isThinking) {
        setCurrentState('thinking');
      } else {
        setCurrentState('idle');
      }
    }
  }, [isSpeaking, isThinking]);

  useEffect(() => {
    updateState();
  }, [updateState]);

  useEffect(() => {
    // Preload image
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => {
      setImageError(true);
      setIsLoaded(true);
    };
    img.src = avatarImage;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [avatarImage]);

  // Lightweight lip sync using CSS animations
  const OptimizedLipSync = () => (
    <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
      <div className="flex gap-0.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`w-0.5 h-2 bg-pink-400 rounded-full transition-all duration-200 ${
              currentState === 'speaking' ? 'animate-pulse' : ''
            }`}
            style={{
              animationDelay: `${i * 50}ms`,
              transform: currentState === 'speaking' ? 'scaleY(1.5)' : 'scaleY(1)',
            }}
          />
        ))}
      </div>
    </div>
  );

  // Subtle breathing animation
  const BreathingEffect = ({ children }: { children: React.ReactNode }) => (
    <div
      className={`transition-transform duration-2000 ${
        currentState === 'thinking' ? 'animate-pulse' : ''
      }`}
      style={{
        animation: currentState === 'idle' ? 'breathing 4s ease-in-out infinite' : 'none',
      }}
    >
      {children}
    </div>
  );

  if (fullBackground) {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-3xl">
          {/* Simple gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 transition-opacity duration-1000 ${
              currentState === 'speaking' ? "opacity-100" : "opacity-50"
            }`}
          />

          <BreathingEffect>
            {/* Avatar Image with minimal animations */}
            {!imageError && isLoaded && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  scale: currentState === 'speaking' ? 1.02 : currentState === 'thinking' ? 1.01 : 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
              >
                <img
                  src={avatarImage}
                  alt="AI Avatar"
                  className="h-full w-auto object-contain"
                  style={{
                    filter: currentState === 'speaking' ? "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))" : "none",
                  transition: "filter 0.3s ease",
                  transform: `scale(${currentState === 'speaking' ? 1.02 : 1})`,
                  }}
                />
              </motion.div>
            )}
          </BreathingEffect>

          {/* Minimal thinking indicator */}
          <AnimatePresence>
            {currentState === 'thinking' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
                transition={{ duration: 0.2 }}
              >
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-blue-500/60"
                      style={{
                        animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simple speaking indicator */}
          <AnimatePresence>
            {currentState === 'speaking' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
                transition={{ duration: 0.2 }}
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-green-500/70 rounded-full"
                      style={{
                        height: '16px',
                        animation: `pulse 0.6s ease-in-out ${i * 0.08}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Small optimized avatar for messages
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-border shadow-lg">
      <BreathingEffect>
        {!imageError && isLoaded && (
          <div className="relative h-full w-full">
            <img
              src={avatarImage}
              alt="AI Avatar"
              className={`h-full w-full object-cover transition-transform duration-300 ${
                currentState === 'speaking' ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        )}
      </BreathingEffect>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Optimized status indicators */}
      <AnimatePresence>
        {currentState === 'speaking' && isLoaded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute bottom-0 right-0 size-2 rounded-full bg-green-500"
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentState === 'thinking' && !isLoaded === false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/5"
            transition={{ duration: 0.15 }}
          >
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-1 w-1 rounded-full bg-blue-500/80"
                  style={{
                    animation: `bounce 0.8s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// CSS animations defined as a style tag to avoid inline styles
const GlobalStyles = () => (
  <style jsx>{`
    @keyframes breathing {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.005); }
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0) scale(1);
      }
      50% {
        transform: translateY(-4px) scale(1.1);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 0.6;
        transform: scaleY(0.8);
      }
      50% {
        opacity: 1;
        transform: scaleY(1);
      }
    }
  `}</style>
);