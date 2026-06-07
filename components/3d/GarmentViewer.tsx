"use client";

import React, { Suspense, useMemo, useLayoutEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three-stdlib";

import * as THREE from 'three';

function ObjModel({ url, colorHex, textureUrl }: { url: string, colorHex?: string, textureUrl?: string }) {
  const obj = useLoader(OBJLoader, url);
  const copiedObj = useMemo(() => obj.clone(), [obj]);

  useLayoutEffect(() => {
    copiedObj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        let mat = mesh.material;
        if (Array.isArray(mat)) {
          mat = mat[0];
        }
        
        if (mat && (mat as THREE.MeshStandardMaterial).color) {
          const standardMat = mat as THREE.MeshStandardMaterial;
          if (colorHex) {
            standardMat.color.set(colorHex);
          }
          if (textureUrl) {
            new THREE.TextureLoader().load(textureUrl, (tex) => {
              standardMat.map = tex;
              standardMat.needsUpdate = true;
            });
          }
        }
      }
    });
  }, [copiedObj, colorHex, textureUrl]);

  return <primitive object={copiedObj} />;
}

function GlbModel({ url, colorHex, textureUrl }: { url: string, colorHex?: string, textureUrl?: string }) {
  const { scene } = useGLTF(url);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        let mat = mesh.material;
        if (Array.isArray(mat)) {
          mat = mat[0];
        }
        
        if (mat && (mat as THREE.MeshStandardMaterial).color) {
          const standardMat = mat as THREE.MeshStandardMaterial;
          // Save original color and map if not saved yet
          if (!mesh.userData.originalColor) {
             mesh.userData.originalColor = standardMat.color.clone();
             mesh.userData.originalMap = standardMat.map;
          }

          if (colorHex) {
            standardMat.color.set(colorHex);
          } else {
            standardMat.color.copy(mesh.userData.originalColor);
          }

          if (textureUrl) {
            new THREE.TextureLoader().load(textureUrl, (tex) => {
              tex.flipY = false;
              tex.colorSpace = THREE.SRGBColorSpace;
              standardMat.map = tex;
              standardMat.needsUpdate = true;
            });
          } else {
            standardMat.map = mesh.userData.originalMap;
            standardMat.needsUpdate = true;
          }
        }
      }
    });
  }, [scene, colorHex, textureUrl]);

  return <primitive object={scene} />;
}

function Model({ url, colorHex, textureUrl, scale = [1,1,1] }: { url: string, colorHex?: string, textureUrl?: string, scale?: [number, number, number] }) {
  const isObj = url.toLowerCase().endsWith('.obj');
  
  // Ensure the URL is absolute so next-intl or relative routing doesn't append '/es/' to it
  const absoluteUrl = typeof window !== 'undefined' && url.startsWith('/') 
    ? `${window.location.origin}${url}` 
    : url;
  
  return (
    <group scale={scale}>
      {isObj ? <ObjModel url={absoluteUrl} colorHex={colorHex} textureUrl={textureUrl} /> : <GlbModel url={absoluteUrl} colorHex={colorHex} textureUrl={textureUrl} />}
    </group>
  );
}

import { ErrorBoundary } from "./ErrorBoundary";

export function GarmentViewer({ 
  url, 
  className,
  colorHex,
  textureUrl,
  scale = [1, 1, 1]
}: { 
  url: string, 
  className?: string,
  colorHex?: string,
  textureUrl?: string,
  scale?: [number, number, number]
}) {
  if (!url) return <div className={`h-full w-full flex items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 text-muted-foreground ${className || 'min-h-[500px]'}`}>Modelo 3D no disponible</div>;

  return (
    <ErrorBoundary>
      <div className={`w-full h-full bg-gradient-to-b from-background/80 to-background/20 rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl ${className || 'min-h-[500px]'}`}>
        <Canvas shadows camera={{ position: [0, 0, 15], fov: 45 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5} adjustCamera>
              <Model url={url} colorHex={colorHex} textureUrl={textureUrl} scale={scale} />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />
        </Canvas>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-6 py-3 bg-background/80 backdrop-blur-xl rounded-full border border-white/10 text-xs font-medium text-muted-foreground shadow-lg">
          <span className="flex items-center gap-2"><span>🖱️</span> Arrastra para rotar</span>
          <span className="flex items-center gap-2"><span>🔍</span> Rueda para zoom</span>
        </div>
      </div>
    </ErrorBoundary>
  );
}
