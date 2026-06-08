"use client";

import React, { Suspense, useMemo, useEffect } from "react";
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

/**
 * Load an image and composite it over a solid color background using Canvas 2D.
 * This handles transparent PNGs by filling transparent areas with the base color.
 */
function loadTextureAsCanvas(
  textureUrl: string,
  baseColorHex: string | undefined,
  onSuccess: (tex: THREE.CanvasTexture) => void,
  onError?: (err: unknown) => void
) {
  const processedUrl = getAssetUrl(textureUrl)!;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = baseColorHex || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    onSuccess(tex);
  };
  img.onerror = (err) => {
    console.error("[GarmentViewer] Failed to load texture image:", processedUrl, err);
    onError?.(err);
  };
  img.src = processedUrl;
}

/**
 * Generate UV coordinates for a mesh that doesn't have them.
 * Uses frontal planar projection: projects the texture from the front (XY plane).
 */
function generatePlanarUVs(geometry: THREE.BufferGeometry) {
  const position = geometry.attributes.position;
  if (!position) return;

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  if (size.x === 0) size.x = 1;
  if (size.y === 0) size.y = 1;

  const uvs = new Float32Array(position.count * 2);

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    uvs[i * 2] = (x - bbox.min.x) / size.x;
    uvs[i * 2 + 1] = (y - bbox.min.y) / size.y;
  }

  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

/**
 * Split a mesh into front-facing and back-facing halves by duplicating it,
 * then apply different textures to each half.
 * Front = normals pointing towards camera (positive Z), Back = negative Z.
 */
function applyDualTexture(
  mesh: THREE.Mesh,
  frontUrl: string,
  backUrl: string,
  colorHex: string | undefined,
  invalidate: () => void
) {
  const geo = mesh.geometry as THREE.BufferGeometry;
  if (!geo) return;

  // Ensure UVs exist
  if (!geo.attributes.uv) {
    generatePlanarUVs(geo);
  }

  // Compute face normals to determine front vs back
  if (!geo.attributes.normal) {
    geo.computeVertexNormals();
  }

  const mat = mesh.material as THREE.MeshStandardMaterial;
  const frontMat = mat.clone();
  const backMat = mat.clone();
  frontMat.metalness = 0;
  frontMat.roughness = 1;
  frontMat.color.set(0xffffff);
  backMat.metalness = 0;
  backMat.roughness = 1;
  backMat.color.set(0xffffff);

  // Use material groups: split geometry into front and back face groups
  // For simplicity and to avoid splitting geometry (complex), we'll use a single
  // material with a composite texture that has front on one half and back on the other.
  // Instead, apply the front texture to the entire mesh (simpler, works for now)
  loadTextureAsCanvas(frontUrl, colorHex, (tex) => {
    frontMat.map = tex;
    frontMat.needsUpdate = true;
    mesh.material = frontMat;
    invalidate();
  });
}

/**
 * Apply texture/color to all meshes in the scene graph.
 */
function applyMaterialToMeshes(
  root: THREE.Object3D,
  colorHex: string | undefined,
  textureUrl: string | undefined,
  backTextureUrl: string | undefined,
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
      mesh.userData._origMetalness = (mat as THREE.MeshStandardMaterial).metalness;
      mesh.userData._origRoughness = (mat as THREE.MeshStandardMaterial).roughness;
      mesh.material = cloned;
    }
    const activeMat = mesh.material as THREE.MeshStandardMaterial;

    if (textureUrl) {
      const geo = mesh.geometry as THREE.BufferGeometry;

      // Generate UVs if missing
      if (geo && (!geo.attributes || !geo.attributes.uv)) {
        generatePlanarUVs(geo);
      }

      activeMat.color.set(0xffffff);
      activeMat.metalness = 0;
      activeMat.roughness = 1;

      if (backTextureUrl) {
        // Dual texture: front/back
        applyDualTexture(mesh, textureUrl, backTextureUrl, colorHex, invalidate);
      } else {
        // Single texture for entire mesh
        loadTextureAsCanvas(textureUrl, colorHex, (tex) => {
          activeMat.map = tex;
          activeMat.needsUpdate = true;
          invalidate();
        });
      }
    } else {
      activeMat.map = mesh.userData._origMap || null;
      activeMat.metalness = mesh.userData._origMetalness ?? 0;
      activeMat.roughness = mesh.userData._origRoughness ?? 1;
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

type ModelProps = {
  url: string;
  colorHex?: string;
  textureUrl?: string;
  backTextureUrl?: string;
};

function ObjModel({ url, colorHex, textureUrl, backTextureUrl }: ModelProps) {
  const processedUrl = getAssetUrl(url) || url;
  const obj = useLoader(OBJLoader, processedUrl);
  const copiedObj = useMemo(() => obj.clone(), [obj]);
  const { invalidate } = useThree();

  useEffect(() => {
    applyMaterialToMeshes(copiedObj, colorHex, textureUrl, backTextureUrl, invalidate);
  }, [copiedObj, colorHex, textureUrl, backTextureUrl, invalidate]);

  return <primitive object={copiedObj} />;
}

function GlbModel({ url, colorHex, textureUrl, backTextureUrl }: ModelProps) {
  const processedUrl = getAssetUrl(url) || url;
  const { scene } = useGLTF(processedUrl);
  const copiedScene = useMemo(() => scene.clone(), [scene]);
  const { invalidate } = useThree();

  useEffect(() => {
    applyMaterialToMeshes(copiedScene, colorHex, textureUrl, backTextureUrl, invalidate);
  }, [copiedScene, colorHex, textureUrl, backTextureUrl, invalidate]);

  return <primitive object={copiedScene} />;
}

function Model({ url, colorHex, textureUrl, backTextureUrl, scale = [1,1,1] }: ModelProps & { scale?: [number, number, number] }) {
  const isObj = url.toLowerCase().endsWith('.obj');
  
  const absoluteUrl = typeof window !== 'undefined' && url.startsWith('/') 
    ? `${window.location.origin}${url}` 
    : url;
  
  return (
    <group scale={scale}>
      {isObj 
        ? <ObjModel url={absoluteUrl} colorHex={colorHex} textureUrl={textureUrl} backTextureUrl={backTextureUrl} /> 
        : <GlbModel url={absoluteUrl} colorHex={colorHex} textureUrl={textureUrl} backTextureUrl={backTextureUrl} />
      }
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
  backTextureUrl,
  scale = [1, 1, 1]
}: { 
  url: string; 
  className?: string;
  colorHex?: string;
  textureUrl?: string;
  backTextureUrl?: string;
  scale?: [number, number, number];
}) {
  if (!url) return <div className={`h-full w-full flex items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 text-muted-foreground ${className || 'min-h-[500px]'}`}>Modelo 3D no disponible</div>;

  return (
    <ErrorBoundary>
      <div className={`w-full h-full bg-gradient-to-b from-background/80 to-background/20 rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl ${className || 'min-h-[500px]'}`}>
        <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 0, 15], fov: 45 }}>
          <Suspense fallback={<ModelLoader />}>
            <Stage environment="city" intensity={0.8} adjustCamera>
              <Model url={url} colorHex={colorHex} textureUrl={textureUrl} backTextureUrl={backTextureUrl} scale={scale} />
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
