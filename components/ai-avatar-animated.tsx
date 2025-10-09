"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";

interface AIAvatarAnimatedProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  text?: string;
  fullBackground?: boolean;
}

export function AIAvatarAnimated({
  isThinking = false,
  isSpeaking = false,
  fullBackground = false
}: AIAvatarAnimatedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lipSyncAnimation, setLipSyncAnimation] = useState<any>(null);
  const [idleAnimation, setIdleAnimation] = useState<any>(null);
  const [thinkingAnimation, setThinkingAnimation] = useState<any>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string>("idle");
  const lottieRef = useRef<any>(null);

  // Your Ready Player Me avatar
  const avatarImage = "https://models.readyplayer.me/68e71278fedc245300f49d27.png";

  // Animation states
  useEffect(() => {
    if (isSpeaking) {
      setCurrentAnimation("speaking");
    } else if (isThinking) {
      setCurrentAnimation("thinking");
    } else {
      setCurrentAnimation("idle");
    }
  }, [isSpeaking, isThinking]);

  // Load Lottie animations (you would need to upload these JSON files)
  useEffect(() => {
    // These would be actual Lottie JSON files
    // For now, I'll create simple animated components
  }, []);

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

  // Lip sync animation using CSS
  const LipSyncAnimation = () => (
    <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 h-3 bg-pink-400 rounded-full"
            animate={{
              scaleY: isSpeaking ? [1, 1.5, 1] : [1, 1, 1],
              opacity: isSpeaking ? [0.8, 1, 0.8] : [0.3, 0.3, 0.3],
            }}
            transition={{
              duration: 0.3,
              repeat: isSpeaking ? Infinity : 0,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );

  // Arm movement animation
  const ArmMovement = () => (
    <motion.div
      className="absolute top-1/4 -right-8 w-16 h-1 bg-blue-400 rounded-full origin-left"
      animate={{
        rotate: isSpeaking ? [-10, 10, -10] : [0, 0, 0],
      }}
      transition={{
        duration: 2,
        repeat: isSpeaking ? Infinity : 0,
        ease: "easeInOut"
      }}
    />
  );

  // Body breathing animation
  const BodyAnimation = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      animate={{
        scale: isThinking ? [1, 1.02, 1] : [1, 1.005, 1],
        y: isThinking ? [0, -2, 0] : [0, -1, 0],
      }}
      transition={{
        duration: isThinking ? 2 : 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );

  if (fullBackground) {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-3xl">
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"
            animate={{
              opacity: isSpeaking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: isSpeaking ? Infinity : 0,
              ease: "easeInOut"
            }}
          />

          <BodyAnimation>
            {/* Avatar Image with 3D-like effects */}
            {!imageError && isLoaded && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  rotateY: isThinking ? [-5, 5, -5] : [0, 0, 0],
                  rotateX: isThinking ? [-2, 2, -2] : [0, 0, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
              >
                <motion.img
                  src={avatarImage}
                  alt="AI Avatar"
                  className="h-full w-auto object-contain"
                  style={{
                    filter: isSpeaking ? "drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))" : "none",
                    transform: "translateZ(50px)"
                  }}
                  animate={{
                    scale: isSpeaking ? 1.05 : isThinking ? 1.02 : 0.95,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                />

                {/* Arm movement */}
                <ArmMovement />
              </motion.div>
            )}
          </BodyAnimation>

          {/* Lip sync animation */}
          <AnimatePresence>
            {isSpeaking && <LipSyncAnimation />}
          </AnimatePresence>

          {/* Enhanced thinking animation */}
          <AnimatePresence>
            {isThinking && !isSpeaking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
              >
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
                      animate={{
                        y: [0, -10, 0],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced speaking wave animation */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
              >
                <div className="flex gap-1">
                  {[...Array(7)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-gradient-to-t from-green-500 to-blue-500"
                      animate={{
                        height: [10 + Math.sin(i * 0.5) * 8, 20 + Math.sin(i * 0.5) * 15, 10 + Math.sin(i * 0.5) * 8],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
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

  // Small animated avatar for messages
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-border shadow-lg">
      <BodyAnimation>
        {!imageError && isLoaded && (
          <motion.div
            className="relative h-full w-full"
            animate={{
              rotateY: isThinking ? [-3, 3, -3] : [0, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              transformStyle: "preserve-3d"
            }}
          >
            <img
              src={avatarImage}
              alt="AI Avatar"
              className="h-full w-full object-cover"
              style={{
                transform: "translateZ(20px)"
              }}
            />
          </motion.div>
        )}
      </BodyAnimation>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <motion.div
            className="size-4 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Enhanced speaking indicator */}
      <AnimatePresence>
        {isSpeaking && isLoaded && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute bottom-0 right-0 flex gap-0.5 rounded-tl-lg bg-green-500/20 p-1 backdrop-blur-sm"
          >
            <motion.div
              className="h-2 w-0.5 bg-green-500"
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="h-2 w-0.5 bg-green-500"
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0.1, ease: "easeInOut" }}
            />
            <motion.div
              className="h-2 w-0.5 bg-green-500"
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced thinking indicator */}
      <AnimatePresence>
        {isThinking && !isSpeaking && isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/10"
          >
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-blue-500"
                  animate={{
                    y: [0, -3, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeOut"
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