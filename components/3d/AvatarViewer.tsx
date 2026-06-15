"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Center } from "@react-three/drei";

interface AvatarModelProps {
  modelUrl: string;
}

function AvatarModel({ modelUrl }: AvatarModelProps) {
  const { scene } = useGLTF(modelUrl);
  return (
    <Center>
      <primitive object={scene} scale={1.5} />
    </Center>
  );
}

interface AvatarViewerProps {
  modelUrl: string;
}

export function AvatarViewer({ modelUrl }: AvatarViewerProps) {
  return (
    <div className="w-full h-full relative bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10">
      <Canvas shadows camera={{ position: [0, 1, 4], fov: 45 }}>
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshBasicMaterial color="#3b82f6" wireframe />
            </mesh>
          }
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <Environment preset="city" />
          <AvatarModel modelUrl={modelUrl} />
          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5} 
            minDistance={2} 
            maxDistance={6} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
