"use client";

import React, { Suspense, useMemo, useLayoutEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three-stdlib";

import * as THREE from 'three';

// Suppress THREE.js deprecation warnings that come from internal R3F/Drei dependencies
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('THREE.Clock') || args[0].includes('THREE.WebGLShadowMap'))) return;
    originalWarn(...args);
  };
}

const textureCache = new Map<string, THREE.Texture>();

function getAssetUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('r2://')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/api/r2?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function loadTexture(textureUrl: string, callback: (tex: THREE.Texture) => void) {
  const processedUrl = getAssetUrl(textureUrl)!;
  if (textureCache.has(processedUrl)) {
    callback(textureCache.get(processedUrl)!);
  } else {
    new THREE.TextureLoader().load(processedUrl, (tex) => {
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(processedUrl, tex);
      callback(tex);
    });
  }
}

function ObjModel({ url, colorHex, textureUrl }: { url: string, colorHex?: string, textureUrl?: string }) {
  const processedUrl = getAssetUrl(url) || url;
  const obj = useLoader(OBJLoader, processedUrl);
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
          if (textureUrl) {
            if (colorHex) standardMat.color.set(colorHex);
            else standardMat.color.set(0xffffff);
            
            loadTexture(textureUrl, (tex) => {
              standardMat.map = tex;
              standardMat.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <map_fragment>',
                  `
                  #ifdef USE_MAP
                    vec4 sampledDiffuseColor = texture2D( map, vMapUv );
                    diffuseColor = vec4( mix( diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a ), diffuseColor.a );
                  #endif
                  `
                );
              };
              standardMat.needsUpdate = true;
            });
          } else if (colorHex) {
            standardMat.color.set(colorHex);
            standardMat.onBeforeCompile = () => {};
            standardMat.needsUpdate = true;
          }
        }
      }
    });
  }, [copiedObj, colorHex, textureUrl]);

  return <primitive object={copiedObj} />;
}

function GlbModel({ url, colorHex, textureUrl }: { url: string, colorHex?: string, textureUrl?: string }) {
  const processedUrl = getAssetUrl(url) || url;
  const { scene } = useGLTF(processedUrl);

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

          if (textureUrl) {
            if (colorHex) standardMat.color.set(colorHex);
            else standardMat.color.set(0xffffff);
            
            loadTexture(textureUrl, (tex) => {
              standardMat.map = tex;
              standardMat.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                  '#include <map_fragment>',
                  `
                  #ifdef USE_MAP
                    vec4 sampledDiffuseColor = texture2D( map, vMapUv );
                    diffuseColor = vec4( mix( diffuseColor.rgb, sampledDiffuseColor.rgb, sampledDiffuseColor.a ), diffuseColor.a );
                  #endif
                  `
                );
              };
              standardMat.needsUpdate = true;
            });
          } else {
            standardMat.map = mesh.userData.originalMap;
            if (colorHex) {
              standardMat.color.set(colorHex);
            } else {
              standardMat.color.copy(mesh.userData.originalColor);
            }
            standardMat.onBeforeCompile = () => {};
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
import { Html, useProgress } from "@react-three/drei";
import { Loader2 } from "lucide-react";

function ModelLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-foreground font-bold text-lg whitespace-nowrap">Cargando 3D...</p>
        <p className="text-muted-foreground text-sm font-medium mt-1">{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

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
        <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 0, 15], fov: 45 }}>
          <Suspense fallback={<ModelLoader />}>
            <Stage environment="city" intensity={0.8} adjustCamera>
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
