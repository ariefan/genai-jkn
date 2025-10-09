"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Float, Stars, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";

interface AIAvatar3DThreeProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  text?: string;
  fullBackground?: boolean;
}

// 3D Avatar Head Component
function AvatarHead({ isSpeaking, isThinking }: { isSpeaking: boolean; isThinking: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animation states
  useEffect(() => {
    if (meshRef.current) {
      if (isSpeaking) {
        // Speaking animation - slight nodding
        meshRef.current.rotation.x = 0.1;
      } else if (isThinking) {
        // Thinking animation - slight head tilt
        meshRef.current.rotation.z = 0.2;
      } else {
        // Idle state
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.z = 0;
      }
    }
  }, [isSpeaking, isThinking]);

  return (
    <Float speed={isThinking ? 2 : 1} rotationIntensity={0.2} floatIntensity={0.5}>
      <group>
        {/* Head */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial
            color={isSpeaking ? "#60a5fa" : isThinking ? "#a78bfa" : "#818cf8"}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>

        {/* Eyes */}
        <group position={[0, 0.2, 0.8]}>
          {/* Left Eye */}
          <mesh position={[-0.3, 0, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[-0.3, 0, 0.05]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="black" />
          </mesh>

          {/* Right Eye */}
          <mesh position={[0.3, 0, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.3, 0, 0.05]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="black" />
          </mesh>
        </group>

        {/* Mouth */}
        <mesh position={[0, -0.3, 0.8]}>
          <boxGeometry args={[0.3, 0.1, 0.05]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[1.1, 32, 32]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
    </Float>
  );
}

// Arm components
function Arms({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <group>
      {/* Left Arm */}
      <mesh position={[-1.5, 0, 0]} rotation={[0, 0, isSpeaking ? 0.5 : 0]}>
        <boxGeometry args={[0.3, 2, 0.3]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>

      {/* Right Arm */}
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, isSpeaking ? -0.5 : 0]}>
        <boxGeometry args={[0.3, 2, 0.3]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

// Speaking waves visualization
function SpeakingWaves({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <group position={[0, -2, 0]}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[i * 0.3 - 0.6, 0, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// Thinking particles
function ThinkingParticles({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <group position={[0, 2, 0]}>
      {[...Array(3)].map((_, i) => (
        <mesh key={i} position={[i * 0.5 - 0.5, Math.sin(i) * 0.3, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

export function AIAvatar3DThree({
  isThinking = false,
  isSpeaking = false,
  fullBackground = false
}: AIAvatar3DThreeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center">
        <div className="size-16 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (fullBackground) {
    return (
      <div className="pointer-events-none absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

          <group>
            <AvatarHead isSpeaking={isSpeaking} isThinking={isThinking} />
            <Arms isSpeaking={isSpeaking} />
            <SpeakingWaves isActive={isSpeaking} />
            <ThinkingParticles isActive={isThinking} />
          </group>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate={isThinking}
            autoRotateSpeed={isThinking ? 2 : 0}
          />
        </Canvas>

        {/* Text overlay for additional info */}
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="rounded-full bg-green-500/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm text-green-300">Speaking...</p>
            </div>
          </motion.div>
        )}

        {isThinking && !isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="rounded-full bg-blue-500/20 px-4 py-2 backdrop-blur-sm">
              <p className="text-sm text-blue-300">Thinking...</p>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Small 3D avatar for messages
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-border shadow-lg">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} />

        <group scale={0.8}>
          <AvatarHead isSpeaking={isSpeaking} isThinking={isThinking} />
          <SpeakingWaves isActive={isSpeaking} />
          <ThinkingParticles isActive={isThinking && !isSpeaking} />
        </group>
      </Canvas>

      {/* Status indicators */}
      {isSpeaking && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500"
        />
      )}

      {isThinking && !isSpeaking && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute bottom-0 right-0 size-3 rounded-full bg-blue-500"
        />
      )}
    </div>
  );
}