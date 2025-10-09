"use client";

import { useState } from "react";
import { AIAvatar3D } from "./ai-avatar-3d";
import { AIAvatarAnimated } from "./ai-avatar-animated";
import { AIAvatar3DThree } from "./ai-avatar-3d-three";

export function AvatarDemo() {
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarType, setAvatarType] = useState<"2d" | "animated" | "3d">("3d");

  const handleSimulateThinking = () => {
    setIsThinking(true);
    setIsSpeaking(false);
    setTimeout(() => {
      setIsThinking(false);
      setIsSpeaking(true);
      setTimeout(() => {
        setIsSpeaking(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">3D Avatar Animation Demo</h1>
        <p className="text-muted-foreground">
          Choose different avatar types and see their animations
        </p>
      </div>

      {/* Avatar Type Selector */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setAvatarType("2d")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            avatarType === "2d"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          2D Avatar
        </button>
        <button
          onClick={() => setAvatarType("animated")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            avatarType === "animated"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Enhanced 2D
        </button>
        <button
          onClick={() => setAvatarType("3d")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            avatarType === "3d"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          3D Avatar
        </button>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleSimulateThinking}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Simulate Conversation
        </button>
        <button
          onClick={() => {
            setIsThinking(!isThinking);
            setIsSpeaking(false);
          }}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          {isThinking ? "Stop Thinking" : "Start Thinking"}
        </button>
        <button
          onClick={() => {
            setIsSpeaking(!isSpeaking);
            setIsThinking(false);
          }}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          {isSpeaking ? "Stop Speaking" : "Start Speaking"}
        </button>
      </div>

      {/* Status Display */}
      <div className="flex justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isThinking ? "bg-purple-500 animate-pulse" : "bg-gray-300"}`} />
          <span>Thinking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
          <span>Speaking</span>
        </div>
      </div>

      {/* Full Background Avatar Display */}
      <div className="relative h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
        {avatarType === "2d" && (
          <AIAvatar3D
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            fullBackground={true}
          />
        )}
        {avatarType === "animated" && (
          <AIAvatarAnimated
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            fullBackground={true}
          />
        )}
        {avatarType === "3d" && (
          <AIAvatar3DThree
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            fullBackground={true}
          />
        )}
      </div>

      {/* Small Avatar Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center">Small Avatar Examples</h3>
        <div className="flex justify-center gap-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">2D Avatar</p>
            <AIAvatar3D
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              fullBackground={false}
            />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Enhanced 2D</p>
            <AIAvatarAnimated
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              fullBackground={false}
            />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">3D Avatar</p>
            <AIAvatar3DThree
              isThinking={isThinking}
              isSpeaking={isSpeaking}
              fullBackground={false}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-muted rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Animation Features</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">2D Avatar</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Basic thinking/speaking indicators</li>
              <li>• Simple pulse animations</li>
              <li>• Ready Player Me integration</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Enhanced 2D</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Lip sync animations</li>
              <li>• Arm movements</li>
              <li>• 3D rotation effects</li>
              <li>• Body breathing animation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">3D Avatar</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Full 3D model with Three.js</li>
              <li>• Skeletal animations</li>
              <li>• Interactive camera controls</li>
              <li>• Particle effects</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Example Code */}
      <div className="bg-muted rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
        <pre className="text-sm overflow-x-auto">
{`import { AIAvatar3DThree } from './components/ai-avatar-3d-three';

function MyComponent() {
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <AIAvatar3DThree
      isThinking={isThinking}
      isSpeaking={isSpeaking}
      fullBackground={true}
    />
  );
}`}
        </pre>
      </div>
    </div>
  );
}