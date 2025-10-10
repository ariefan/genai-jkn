"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface AIAvatar3DProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  text?: string;
  fullBackground?: boolean;
}

// Mixamo bone name mapping to Ready Player Me
const MIXAMO_TO_RPM_BONE_MAP: { [key: string]: string } = {
  'mixamorigHips': 'Hips',
  'mixamorigSpine': 'Spine',
  'mixamorigSpine1': 'Spine1',
  'mixamorigSpine2': 'Spine2',
  'mixamorigNeck': 'Neck',
  'mixamorigHead': 'Head',
  'mixamorigLeftShoulder': 'LeftShoulder',
  'mixamorigRightShoulder': 'RightShoulder',
  'mixamorigLeftArm': 'LeftArm',
  'mixamorigRightArm': 'RightArm',
  'mixamorigLeftForeArm': 'LeftForeArm',
  'mixamorigRightForeArm': 'RightForeArm',
  'mixamorigLeftHand': 'LeftHand',
  'mixamorigRightHand': 'RightHand',
  'mixamorigLeftUpLeg': 'LeftUpLeg',
  'mixamorigRightUpLeg': 'RightUpLeg',
  'mixamorigLeftLeg': 'LeftLeg',
  'mixamorigRightLeg': 'RightLeg',
  'mixamorigLeftFoot': 'LeftFoot',
  'mixamorigRightFoot': 'RightFoot'
};

// 3D Avatar Model Component with Mixamo animation support
function Avatar3DModel({ isSpeaking, isThinking }: { isSpeaking: boolean; isThinking: boolean }) {
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [mixamoAnimation, setMixamoAnimation] = useState<THREE.AnimationClip | null>(null);

  // Load female model
  const femaleGltf = useLoader(GLTFLoader, "/data/female.glb");

  // Load Mixamo animation asynchronously
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/data/_breathing-idle.glb',
      (gltf) => {
        if (gltf.animations.length > 0) {
          setMixamoAnimation(gltf.animations[0]);
          console.log('Mixamo animation loaded successfully');
        }
      },
      undefined,
      (error) => {
        console.log('Animation file not found, will use procedural animation');
      }
    );
  }, []);

  useEffect(() => {
    if (femaleGltf) {
      console.log('Female model loaded');

      // Set up animation mixer for female model
      mixerRef.current = new THREE.AnimationMixer(femaleGltf.scene);

      // If Mixamo animation is available, apply it with bone retargeting
      if (mixamoAnimation) {
        console.log('Applying Mixamo animation to Ready Player Me model');

        try {
          // Create bone map for the female model
          const boneMap: { [key: string]: THREE.Object3D } = {};
          femaleGltf.scene.traverse((object) => {
            if (object instanceof THREE.Bone || object.type === 'Bone') {
              boneMap[object.name] = object;
            }
          });

          console.log('Ready Player Me bones found:', Object.keys(boneMap));

          // Retarget animation tracks
          const retargetedTracks: THREE.KeyframeTrack[] = [];

          mixamoAnimation.tracks.forEach((track) => {
            const trackName = track.name;
            const parts = trackName.split('.');
            const mixamoBoneName = parts[0];
            const property = parts.slice(1).join('.');

            // Map Mixamo bone to Ready Player Me bone
            const rpmBoneName = MIXAMO_TO_RPM_BONE_MAP[mixamoBoneName];

            if (rpmBoneName && boneMap[rpmBoneName]) {
              const newTrackName = `${rpmBoneName}.${property}`;
              const newTrack = track.clone();
              newTrack.name = newTrackName;
              retargetedTracks.push(newTrack);
            }
          });

          if (retargetedTracks.length > 0) {
            const retargetedClip = new THREE.AnimationClip(
              'mixamoRetargeted',
              mixamoAnimation.duration,
              retargetedTracks
            );
            const action = mixerRef.current.clipAction(retargetedClip);
            action.play();
            console.log(`Successfully retargeted ${retargetedTracks.length} animation tracks`);
          } else {
            console.log('No tracks could be retargeted, falling back to procedural animation');
          }
        } catch (error) {
          console.error('Error retargeting Mixamo animation:', error);
        }
      }
    }
  }, [femaleGltf, mixamoAnimation]);

  // Update animation mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  if (!femaleGltf) {
    return <FallbackAvatar isSpeaking={isSpeaking} isThinking={isThinking} />;
  }

  return (
    <group ref={modelRef} position={[0, -1.8, 0]}>
      <primitive object={femaleGltf.scene} scale={1.6} />
    </group>
  );
}

// Error Boundary for Avatar3DModel
function Avatar3DWithErrorBoundary({ isSpeaking, isThinking }: { isSpeaking: boolean; isThinking: boolean }) {
  return (
    <Suspense fallback={<FallbackAvatar isSpeaking={isSpeaking} isThinking={isThinking} />}>
      <Avatar3DModel isSpeaking={isSpeaking} isThinking={isThinking} />
    </Suspense>
  );
}

// Fallback simple 3D avatar if GLB fails to load
function FallbackAvatar({ isSpeaking, isThinking }: { isSpeaking: boolean; isThinking: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const armLeftRef = useRef<THREE.Mesh>(null);
  const armRightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (groupRef.current) {
      // Body rotation and sway
      groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.15;

      // Breathing movement
      const breathe = Math.sin(time * 0.8) * 0.02;
      groupRef.current.position.y = -0.8 + breathe;
      groupRef.current.scale.y = 0.9 + breathe;
    }

    if (headRef.current) {
      if (isSpeaking) {
        // Talking head bob
        headRef.current.rotation.x = Math.sin(time * 8) * 0.08;
        headRef.current.rotation.y = Math.sin(time * 5) * 0.05;
      } else if (isThinking) {
        // Thinking tilt
        headRef.current.rotation.z = Math.sin(time * 0.6) * 0.15;
        headRef.current.rotation.x = 0.1;
      } else {
        // Idle head movement
        headRef.current.rotation.x = Math.sin(time * 2.3) * 0.03;
        headRef.current.rotation.y = Math.sin(time * 1.7) * 0.05;
        headRef.current.rotation.z = Math.sin(time * 0.9) * 0.04;
      }
    }

    if (bodyRef.current) {
      // Breathing
      const bodyBreathing = Math.sin(time * 0.8) * 0.02;
      bodyRef.current.scale.set(1 + bodyBreathing, 1 + bodyBreathing * 0.5, 1 + bodyBreathing);
    }

    if (armLeftRef.current && armRightRef.current) {
      if (isSpeaking) {
        // Gesturing while speaking
        armLeftRef.current.rotation.z = 0.3 + Math.sin(time * 3) * 0.1;
        armRightRef.current.rotation.z = -0.3 - Math.sin(time * 3 + Math.PI) * 0.1;
      } else {
        // Idle arm sway
        armLeftRef.current.rotation.z = 0.1 + Math.sin(time * 0.7) * 0.05;
        armRightRef.current.rotation.z = -0.1 - Math.sin(time * 0.7) * 0.05;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.8, 0]} scale={0.9}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={isSpeaking ? "#60a5fa" : isThinking ? "#a78bfa" : "#818cf8"} />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 32]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>

      {/* Arms */}
      <mesh ref={armLeftRef} position={[-0.5, -0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      <mesh ref={armRightRef} position={[0.5, -0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.2, -1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1, 16]} />
        <meshStandardMaterial color="#3730a3" />
      </mesh>
      <mesh position={[0.2, -1.2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1, 16]} />
        <meshStandardMaterial color="#3730a3" />
      </mesh>
    </group>
  );
}

export function AIAvatar3D({
  isThinking = false,
  isSpeaking = false,
  fullBackground = false
}: AIAvatar3DProps) {

  if (fullBackground) {
    // Full background 3D avatar - fixed position to stay in viewport
    return (
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0">
        <div className="relative h-full w-full">
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 transition-opacity duration-1000 ${
            isSpeaking ? "opacity-30 animate-pulse" : "opacity-20"
          }`} />

          {/* 3D Canvas - Full Opacity */}
          <Canvas
            camera={{ position: [0, 0.3, 3.8], fov: 50 }}
            style={{ width: "100%", height: "100%", opacity: 1 }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <pointLight position={[-5, 3, -5]} intensity={0.5} />
            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} />

            <Avatar3DWithErrorBoundary isSpeaking={isSpeaking} isThinking={isThinking} />

            {/* Enable user rotation */}
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              enableRotate={true}
              autoRotate={false}
              minDistance={2}
              maxDistance={6}
            />
          </Canvas>

          {/* Floating particles around avatar */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/40 dark:bg-blue-300/40 rounded-full"
                style={{
                  left: `${15 + i * 10}%`,
                  top: `${25 + (i % 3) * 20}%`,
                  animation: `floatParticle ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
          </div>

          {/* Thinking animation */}
          {isThinking && !isSpeaking && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="flex gap-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500/70 dark:bg-blue-400/70" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-purple-500/70 dark:bg-purple-400/70" style={{ animationDelay: "200ms", animationDuration: "1s" }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-pink-500/70 dark:bg-pink-400/70" style={{ animationDelay: "400ms", animationDuration: "1s" }} />
              </div>
            </div>
          )}

          {/* Speaking wave animation */}
          {isSpeaking && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 animate-pulse rounded-full bg-green-500 dark:bg-green-400"
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

  // Small 3D avatar for messages
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-border shadow-lg">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ width: "100%", height: "100%", opacity: 1 }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[5, 5, 5]} intensity={0.6} />

        <Avatar3DWithErrorBoundary isSpeaking={isSpeaking} isThinking={isThinking} />
      </Canvas>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute bottom-0 right-0 flex gap-0.5 rounded-tl-lg bg-green-500/30 p-1 backdrop-blur-sm dark:bg-green-400/30">
          <div className="h-2 w-0.5 animate-pulse bg-green-500 dark:bg-green-400" style={{ animationDelay: "0ms", animationDuration: "600ms" }} />
          <div className="h-2 w-0.5 animate-pulse bg-green-500 dark:bg-green-400" style={{ animationDelay: "200ms", animationDuration: "600ms" }} />
          <div className="h-2 w-0.5 animate-pulse bg-green-500 dark:bg-green-400" style={{ animationDelay: "400ms", animationDuration: "600ms" }} />
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && !isSpeaking && (
        <div className="absolute bottom-0 right-0 flex gap-0.5 rounded-tl-lg bg-blue-500/30 p-1 backdrop-blur-sm dark:bg-blue-400/30">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 dark:bg-blue-400" style={{ animationDelay: "0ms" }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 dark:bg-blue-400" style={{ animationDelay: "150ms" }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 dark:bg-blue-400" style={{ animationDelay: "300ms" }} />
        </div>
      )}
    </div>
  );
}

// Inject CSS animations for particles
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatParticle {
      0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
      }
      25% {
        transform: translateY(-15px) translateX(8px) scale(1.3);
        opacity: 0.7;
      }
      50% {
        transform: translateY(-30px) translateX(-5px) scale(0.9);
        opacity: 1;
      }
      75% {
        transform: translateY(-25px) translateX(12px) scale(1.2);
        opacity: 0.5;
      }
      100% {
        transform: translateY(-45px) translateX(0) scale(0.7);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
