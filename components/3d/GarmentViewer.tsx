"use client";

import React, { Suspense, useMemo, useEffect, useRef } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
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

function getAssetUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('r2://')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/api/r2?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function loadTextureAsCanvas(
  textureUrl: string,
  baseColorHex: string | undefined,
  onSuccess: (tex: THREE.CanvasTexture) => void,
  onError?: (err: unknown) => void
) {
  const processedUrl = getAssetUrl(textureUrl)!;
  console.log("[GarmentViewer] Loading texture from:", processedUrl);
  console.log("[GarmentViewer] Base color:", baseColorHex || "#ffffff");

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    console.log("[GarmentViewer] Image loaded successfully:", img.width, "x", img.height);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    // Fill with base color first
    ctx.fillStyle = baseColorHex || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw the texture image on top (transparent areas show the base color)
    ctx.drawImage(img, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    // CanvasTexture default flipY is true; GLB models may need either depending on UV layout
    // Try true first (canvas default) since the model may expect standard UV orientation
    tex.flipY = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    console.log("[GarmentViewer] CanvasTexture created successfully, flipY=true");
    onSuccess(tex);
  };
  img.onerror = (err) => {
    console.error("[GarmentViewer] Failed to load texture image:", processedUrl, err);
    onError?.(err);
  };
  img.src = processedUrl;
}

function applyMaterialToMeshes(
  root: THREE.Object3D,
  colorHex: string | undefined,
  textureUrl: string | undefined,
  invalidate: () => void
) {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    let mat = mesh.material;
    if (Array.isArray(mat)) mat = mat[0];
    if (!mat || !(mat as THREE.MeshStandardMaterial).color) return;

    // Clone material once so we don't mutate shared materials
    if (!mesh.userData._clonedMat) {
      const cloned = (mat as THREE.MeshStandardMaterial).clone();
      mesh.userData._clonedMat = true;
      mesh.userData._origColor = (mat as THREE.MeshStandardMaterial).color.clone();
      mesh.userData._origMap = (mat as THREE.MeshStandardMaterial).map;
      mesh.material = cloned;
    }
    const activeMat = mesh.material as THREE.MeshStandardMaterial;

    if (textureUrl) {
      // Diagnostic: check if mesh has UV coordinates
      const geo = mesh.geometry as THREE.BufferGeometry;
      const hasUV = geo && geo.attributes && geo.attributes.uv;
      console.log("[GarmentViewer] Mesh:", mesh.name, "| hasUV:", !!hasUV, "| uvCount:", hasUV ? (hasUV as THREE.BufferAttribute).count : 0);
      console.log("[GarmentViewer] Material type:", activeMat.type, "| metalness:", activeMat.metalness, "| roughness:", activeMat.roughness);

      activeMat.color.set(0xffffff);
      // Ensure the texture is visible by making the material non-metallic and fully rough
      activeMat.metalness = 0;
      activeMat.roughness = 1;
      loadTextureAsCanvas(textureUrl, colorHex, (tex) => {
        activeMat.map = tex;
        activeMat.needsUpdate = true;
        invalidate(); // force a re-render of the canvas
        console.log("[GarmentViewer] Texture applied to mesh:", mesh.name || "(unnamed)", "| map uuid:", tex.uuid);
      });
    } else {
      activeMat.map = mesh.userData._origMap || null;
      if (colorHex) {
        activeMat.color.set(colorHex);
      } else if (mesh.userData._origColor) {
        activeMat.color.copy(mesh.userData._origColor);
      }
      activeMat.needsUpdate = true;
      invalidate();
    }
  });
}

function ObjModel({ url, colorHex, textureUrl }: { url: string; colorHex?: string; textureUrl?: string }) {
  const processedUrl = getAssetUrl(url) || url;
  const obj = useLoader(OBJLoader, processedUrl);
  const copiedObj = useMemo(() => obj.clone(), [obj]);
  const { invalidate } = useThree();

  useEffect(() => {
    console.log("[GarmentViewer] ObjModel useEffect — textureUrl:", textureUrl, "colorHex:", colorHex);
    applyMaterialToMeshes(copiedObj, colorHex, textureUrl, invalidate);
  }, [copiedObj, colorHex, textureUrl, invalidate]);

  return <primitive object={copiedObj} />;
}

function GlbModel({ url, colorHex, textureUrl }: { url: string; colorHex?: string; textureUrl?: string }) {
  const processedUrl = getAssetUrl(url) || url;
  const { scene } = useGLTF(processedUrl);
  const copiedScene = useMemo(() => scene.clone(), [scene]);
  const { invalidate } = useThree();

  useEffect(() => {
    console.log("[GarmentViewer] GlbModel useEffect — textureUrl:", textureUrl, "colorHex:", colorHex);
    applyMaterialToMeshes(copiedScene, colorHex, textureUrl, invalidate);
  }, [copiedScene, colorHex, textureUrl, invalidate]);

  return <primitive object={copiedScene} />;
}

function Model({ url, colorHex, textureUrl, scale = [1,1,1] }: { url: string; colorHex?: string; textureUrl?: string; scale?: [number, number, number] }) {
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
  url: string; 
  className?: string;
  colorHex?: string;
  textureUrl?: string;
  scale?: [number, number, number];
}) {
  console.log("[GarmentViewer] Render — url:", url, "textureUrl:", textureUrl, "colorHex:", colorHex);

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
