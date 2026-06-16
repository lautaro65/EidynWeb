"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Center } from "@react-three/drei";
import { OBJLoader } from "three-stdlib";
import * as THREE from "three";

interface AvatarModelProps {
  modelUrl: string;
}

function ObjModel({ modelUrl }: { modelUrl: string }) {
  const obj = useLoader(OBJLoader, modelUrl);
  
  // Create a default material since OBJ doesn't come with one
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#e2e8f0",
    roughness: 0.4,
    metalness: 0.1,
  }), []);

  // Apply material to all meshes inside the OBJ
  const scene = useMemo(() => {
    const clone = obj.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = material;
        // Bodygram models can sometimes need geometry centering, Center handles bounds
      }
    });
    return clone;
  }, [obj, material]);

  return (
    <Center>
      <primitive object={scene} scale={0.05} /> {/* OBJ from Bodygram might need scale adjustment compared to GLB */}
    </Center>
  );
}

function GlbModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return (
    <Center>
      <primitive object={scene} scale={1.5} />
    </Center>
  );
}

function AvatarModel({ modelUrl }: AvatarModelProps) {
  const isObj = modelUrl.toLowerCase().includes(".obj");
  
  if (isObj) {
    return <ObjModel modelUrl={modelUrl} />;
  }
  
  return <GlbModel modelUrl={modelUrl} />;
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
