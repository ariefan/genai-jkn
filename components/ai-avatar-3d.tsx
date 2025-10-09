"use client";

import { useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface AIAvatar3DProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  text?: string;
  fullBackground?: boolean;
}

// 3D Avatar Model Component with skeletal animations
function Avatar3DModel({ isSpeaking, isThinking }: { isSpeaking: boolean; isThinking: boolean }) {
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const neckBoneRef = useRef<THREE.Bone | null>(null);
  const shoulderLeftRef = useRef<THREE.Bone | null>(null);
  const shoulderRightRef = useRef<THREE.Bone | null>(null);

  // Random movement state
  const randomMovementRef = useRef({
    headTurnTarget: 0,
    headNodTarget: 0,
    shoulderTiltTarget: 0,
    nextChangeTime: 0,
  });

  // Load the GLB model from Ready Player Me
  const avatarUrl = "https://models.readyplayer.me/68e71278fedc245300f49d27.glb";

  const gltf = useLoader(GLTFLoader, avatarUrl);

  useEffect(() => {
    if (gltf) {
      // Find bones for skeletal animation
      gltf.scene.traverse((object) => {
        if (object instanceof THREE.Bone || object.type === 'Bone') {
          const boneName = object.name.toLowerCase();

          // Ready Player Me bone naming convention
          if ((boneName.includes('head') || boneName === 'head') && !headBoneRef.current) {
            headBoneRef.current = object as THREE.Bone;
            console.log('Found head bone:', object.name);
          } else if ((boneName.includes('neck') || boneName === 'neck') && !neckBoneRef.current) {
            neckBoneRef.current = object as THREE.Bone;
            console.log('Found neck bone:', object.name);
          } else if ((boneName.includes('spine') || boneName.includes('chest') || boneName === 'spine2') && !spineBoneRef.current) {
            spineBoneRef.current = object as THREE.Bone;
            console.log('Found spine bone:', object.name);
          } else if ((boneName.includes('leftshoulder') || boneName.includes('shoulder_l') || boneName === 'leftshoulder')) {
            shoulderLeftRef.current = object as THREE.Bone;
            console.log('Found left shoulder bone:', object.name);
          } else if ((boneName.includes('rightshoulder') || boneName.includes('shoulder_r') || boneName === 'rightshoulder')) {
            shoulderRightRef.current = object as THREE.Bone;
            console.log('Found right shoulder bone:', object.name);
          }
        }
      });

      // Setup animation mixer for built-in or Mixamo animations
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(gltf.scene);
        mixerRef.current = mixer;

        console.log('Found animations:', gltf.animations.map(a => a.name));

        // Play the first idle animation (usually the default pose)
        const idleClip = gltf.animations[0];
        const idleAction = mixer.clipAction(idleClip);

        idleAction.setLoop(THREE.LoopRepeat, Infinity);
        idleAction.clampWhenFinished = false;
        idleAction.play();

        // If there are additional animations, blend them
        if (gltf.animations.length > 1) {
          gltf.animations.slice(1).forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.setEffectiveWeight(0.2); // Subtle blend
            action.play();
          });
        }

        return () => {
          mixer.stopAllAction();
        };
      } else {
        console.log('No animations found in GLB model');
      }
    }
  }, [gltf]);

  // Animate the model with lifelike movements
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Update animation mixer - this is the main idle animation
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Only apply subtle procedural animations if no built-in animations exist
    const hasAnimations = gltf?.animations && gltf.animations.length > 0;

    // Update random movement targets every 3-5 seconds (slower)
    if (time > randomMovementRef.current.nextChangeTime) {
      randomMovementRef.current.headTurnTarget = (Math.random() - 0.5) * 0.15; // Reduced from 0.4
      randomMovementRef.current.headNodTarget = (Math.random() - 0.5) * 0.08; // Reduced from 0.2
      randomMovementRef.current.shoulderTiltTarget = (Math.random() - 0.5) * 0.05; // Reduced from 0.15
      randomMovementRef.current.nextChangeTime = time + 3 + Math.random() * 2;
    }

    if (modelRef.current) {
      // Only apply these if there are NO built-in animations
      if (!hasAnimations) {
        // 1. BREATHING - very subtle
        const breatheCycle = Math.sin(time * 0.8) * 0.01 + 1;
        const breatheOffset = Math.sin(time * 0.8) * 0.003;
        modelRef.current.scale.set(
          1 + breatheOffset,
          breatheCycle,
          1 + breatheOffset
        );

        // 2. WEIGHT SHIFT - minimal
        const weightShift = Math.sin(time * 0.4) * 0.01;
        modelRef.current.position.x = weightShift;
        modelRef.current.rotation.z = weightShift * 0.3;

        // 3. IDLE ROTATION - very slow
        const idleRotation = Math.sin(time * 0.15) * 0.08;
        modelRef.current.rotation.y = idleRotation;

        // 4. VERTICAL BREATHING MOVEMENT - subtle
        const verticalBob = Math.sin(time * 0.8) * 0.005;
        modelRef.current.position.y = -1.8 + verticalBob;
      } else {
        // With animations, just keep stable position
        modelRef.current.position.y = -1.8;
        modelRef.current.scale.set(1, 1, 1);
        modelRef.current.rotation.z = 0;
      }
    }

    // SKELETAL ANIMATIONS - Only apply if no built-in animations or when speaking/thinking
    const shouldApplyBoneAnimation = !hasAnimations || isSpeaking || isThinking;

    if (headBoneRef.current && shouldApplyBoneAnimation) {
      const lerpSpeed = delta * 1.5; // Slightly slower

      // Natural head movements
      const currentHeadRotX = headBoneRef.current.rotation.x;
      const currentHeadRotY = headBoneRef.current.rotation.y;
      const currentHeadRotZ = headBoneRef.current.rotation.z;

      if (isSpeaking) {
        // Talking animation - jaw movement and head nods
        const talkNod = Math.sin(time * 8) * 0.05; // Reduced from 0.08
        const talkTurn = Math.sin(time * 5 + 1) * 0.03; // Reduced from 0.05
        headBoneRef.current.rotation.x = THREE.MathUtils.lerp(currentHeadRotX, talkNod, lerpSpeed);
        headBoneRef.current.rotation.y = THREE.MathUtils.lerp(currentHeadRotY, talkTurn, lerpSpeed);
      } else if (isThinking) {
        // Thinking pose - head tilt and slight up look
        const thinkTilt = Math.sin(time * 0.6) * 0.08; // Reduced from 0.15
        const thinkLookUp = 0.05; // Reduced from 0.1
        headBoneRef.current.rotation.z = THREE.MathUtils.lerp(currentHeadRotZ, thinkTilt, lerpSpeed);
        headBoneRef.current.rotation.x = THREE.MathUtils.lerp(currentHeadRotX, thinkLookUp, lerpSpeed);
      } else if (!hasAnimations) {
        // Only apply idle movements if there's no built-in animation
        const microMovementX = Math.sin(time * 2.3) * 0.015; // Reduced from 0.03
        const microMovementY = Math.sin(time * 1.7) * 0.01; // Reduced from 0.02

        headBoneRef.current.rotation.x = THREE.MathUtils.lerp(
          currentHeadRotX,
          randomMovementRef.current.headNodTarget + microMovementX,
          lerpSpeed
        );
        headBoneRef.current.rotation.y = THREE.MathUtils.lerp(
          currentHeadRotY,
          randomMovementRef.current.headTurnTarget + microMovementY,
          lerpSpeed
        );
        headBoneRef.current.rotation.z = THREE.MathUtils.lerp(
          currentHeadRotZ,
          Math.sin(time * 0.9) * 0.025, // Reduced from 0.05
          lerpSpeed
        );
      }
    }

    // Only apply subtle bone movements if no animations or in specific states
    if (!hasAnimations || isSpeaking || isThinking) {
      // NECK MOVEMENT - follows head but more subtle
      if (neckBoneRef.current && headBoneRef.current) {
        neckBoneRef.current.rotation.x = headBoneRef.current.rotation.x * 0.2; // Reduced from 0.3
        neckBoneRef.current.rotation.y = headBoneRef.current.rotation.y * 0.3; // Reduced from 0.4
        neckBoneRef.current.rotation.z = headBoneRef.current.rotation.z * 0.15; // Reduced from 0.2
      }

      // SPINE MOVEMENT - very subtle breathing
      if (spineBoneRef.current && !hasAnimations) {
        const spineBreathing = Math.sin(time * 0.8) * 0.01; // Reduced from 0.02
        spineBoneRef.current.rotation.x = spineBreathing;

        // Minimal spine sway
        const spineSway = Math.sin(time * 0.5) * 0.008; // Reduced from 0.015
        spineBoneRef.current.rotation.z = spineSway;
      }

      // SHOULDER MOVEMENT - only when speaking
      if (shoulderLeftRef.current && shoulderRightRef.current && isSpeaking) {
        const gestureLeft = Math.sin(time * 3) * 0.05; // Reduced from 0.08
        const gestureRight = Math.sin(time * 3 + Math.PI) * 0.05;
        shoulderLeftRef.current.rotation.x = gestureLeft;
        shoulderRightRef.current.rotation.x = gestureRight;
      }
    }
  });

  if (!gltf) {
    return <FallbackAvatar isSpeaking={isSpeaking} isThinking={isThinking} />;
  }

  return (
    <group ref={modelRef} position={[0, -1.8, 0]}>
      <primitive object={gltf.scene} scale={1.6} />
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
                className="absolute w-2 h-2 bg-blue-400/40 rounded-full"
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
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500/70" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-purple-500/70" style={{ animationDelay: "200ms", animationDuration: "1s" }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-pink-500/70" style={{ animationDelay: "400ms", animationDuration: "1s" }} />
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
                    className="w-1.5 animate-pulse rounded-full bg-green-500"
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
        <div className="absolute bottom-0 right-0 flex gap-0.5 rounded-tl-lg bg-green-500/30 p-1 backdrop-blur-sm">
          <div className="h-2 w-0.5 animate-pulse bg-green-500" style={{ animationDelay: "0ms", animationDuration: "600ms" }} />
          <div className="h-2 w-0.5 animate-pulse bg-green-500" style={{ animationDelay: "200ms", animationDuration: "600ms" }} />
          <div className="h-2 w-0.5 animate-pulse bg-green-500" style={{ animationDelay: "400ms", animationDuration: "600ms" }} />
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && !isSpeaking && (
        <div className="absolute bottom-0 right-0 flex gap-0.5 rounded-tl-lg bg-blue-500/30 p-1 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "0ms" }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "150ms" }} />
          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: "300ms" }} />
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
