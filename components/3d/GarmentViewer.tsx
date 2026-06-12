"use client";

import React, { Suspense, useMemo, useEffect } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three-stdlib";
import { MousePointer2, ZoomIn } from "lucide-react";

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
 * Load an image, auto-crop transparent padding, and composite using 3-layer bleed:
 *   Layer 1: Solid fill with the garment's dominant color (covers everything)
 *   Layer 2: Blurred + enlarged garment (smooth bleed near edges)
 *   Layer 3: Sharp original garment (actual detail)
 * This ensures zero white/blank gaps — any area outside the garment silhouette
 * is filled with matching colors from the garment itself.
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
    // 1. Draw on temp canvas to detect content bounds + dominant color
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(img, 0, 0);

    let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;
    let dominantColor = baseColorHex || "#888888";

    try {
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const { data } = imageData;
      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
      let transparentPixels = 0;
      let totalR = 0, totalG = 0, totalB = 0, opaqueCount = 0;

      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const idx = (y * img.width + x) * 4;
          const alpha = data[idx + 3];
          if (alpha < 128) { transparentPixels++; continue; }
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          // Accumulate color for dominant color calculation
          totalR += data[idx];
          totalG += data[idx + 1];
          totalB += data[idx + 2];
          opaqueCount++;
        }
      }

      const totalPixels = img.width * img.height;
      const hasTransparency = transparentPixels > totalPixels * 0.05;

      if (hasTransparency && maxX > minX && maxY > minY) {
        cropX = minX;
        cropY = minY;
        cropW = maxX - minX + 1;
        cropH = maxY - minY + 1;

        // Compute dominant garment color from opaque pixels
        if (opaqueCount > 0) {
          const avgR = Math.round(totalR / opaqueCount);
          const avgG = Math.round(totalG / opaqueCount);
          const avgB = Math.round(totalB / opaqueCount);
          dominantColor = `rgb(${avgR},${avgG},${avgB})`;
        }
      }
    } catch (e) {
      console.warn("[GarmentViewer] Auto-crop failed (CORS?), using full image", e);
    }

    // 2. Create SQUARE canvas with content centered
    // Square ensures uniform UV scaling (no stretch) and proper centering
    const maxDim = Math.max(cropW, cropH);
    const pad = Math.max(8, Math.round(maxDim * 0.04)); // 4% breathing room
    const canvasSize = maxDim + pad * 2;
    const drawX = pad + (maxDim - cropW) / 2; // center horizontally
    const drawY = pad + (maxDim - cropH) / 2; // center vertically

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d")!;

    // Layer 1: Solid dominant garment color (fills everything, no white gaps)
    ctx.fillStyle = dominantColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Layer 2: Blurred + enlarged version for smooth edge bleed
    ctx.save();
    ctx.filter = "blur(15px)";
    const bleed = 1.3;
    const bleedW = cropW * bleed;
    const bleedH = cropH * bleed;
    const bx = drawX - (bleedW - cropW) / 2;
    const by = drawY - (bleedH - cropH) / 2;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, bx, by, bleedW, bleedH);
    ctx.restore();

    // Layer 3: Sharp original on top (the actual garment detail)
    ctx.drawImage(img, cropX, cropY, cropW, cropH, drawX, drawY, cropW, cropH);

    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    onSuccess(tex);
  };
  img.onerror = (err) => {
    console.error("[GarmentViewer] Failed to load texture image:", processedUrl, err);
    onError?.(err);
  };
  img.src = processedUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dual Projection Shader
// Projects front texture from +Z and back texture from -Z,
// blending smoothly on the sides. Works with ANY model geometry.
// ─────────────────────────────────────────────────────────────────────────────

const dualProjectionVertex = /* glsl */ `
  varying vec3 vModelNormal;
  varying vec3 vViewNormal;
  varying vec2 vProjectedUV;
  varying vec3 vViewPosition;

  uniform vec3 bboxMin;
  uniform vec3 bboxSize;

  void main() {
    // Model-space normal → determines front vs back of garment
    vModelNormal = normalize(normal);
    // View-space normal → used for lighting
    vViewNormal = normalize(normalMatrix * normal);

    // Center-based UV projection with uniform scaling
    // Uses the larger axis for both X and Y to prevent distortion
    vec3 bboxCenter = bboxMin + bboxSize * 0.5;
    float maxAxis = max(bboxSize.x, bboxSize.y);
    vProjectedUV = vec2(
      0.5 + (position.x - bboxCenter.x) / maxAxis,
      0.5 + (position.y - bboxCenter.y) / maxAxis
    );

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const dualProjectionFragment = /* glsl */ `
  uniform sampler2D frontMap;
  uniform sampler2D backMap;
  uniform bool hasFrontMap;
  uniform bool hasBackMap;
  uniform vec3 baseColor;

  varying vec3 vModelNormal;
  varying vec3 vViewNormal;
  varying vec2 vProjectedUV;
  varying vec3 vViewPosition;

  void main() {
    vec3 modelNorm = normalize(vModelNormal);
    vec3 viewNorm = normalize(vViewNormal);

    // UV scale: 1.0 = exact fit (auto-crop already removes padding from the image)
    float uvScale = 1.0;
    float uvOffset = (1.0 - uvScale) / 2.0;
    vec2 frontUV = clamp(uvOffset + vProjectedUV * uvScale, 0.0, 1.0);
    // Mirror X for back view (left↔right flip when seen from behind)
    vec2 backUV = clamp(vec2(1.0 - frontUV.x, frontUV.y), 0.0, 1.0);

    // Determine front vs back based on model-space normal Z
    // smoothstep creates a soft blend on the side edges
    float frontFactor = smoothstep(-0.15, 0.15, modelNorm.z);

    vec4 frontCol = hasFrontMap ? texture2D(frontMap, frontUV) : vec4(baseColor, 1.0);
    vec4 backCol  = hasBackMap  ? texture2D(backMap, backUV)   : vec4(baseColor, 1.0);

    vec4 texColor = mix(backCol, frontCol, frontFactor);

    // ── Lighting (multi-directional, soft) ──
    vec3 light1 = normalize(vec3(0.5, 0.8, 1.0));
    vec3 light2 = normalize(vec3(-0.4, 0.6, -0.7));
    vec3 light3 = normalize(vec3(0.0, -0.2, 0.5));

    float diff = max(dot(viewNorm, light1), 0.0) * 0.45
               + max(dot(viewNorm, light2), 0.0) * 0.25
               + max(dot(viewNorm, light3), 0.0) * 0.15;
    float ambient = 0.5;

    // Subtle specular highlight
    vec3 viewDir = normalize(vViewPosition);
    vec3 halfDir = normalize(light1 + viewDir);
    float spec = pow(max(dot(viewNorm, halfDir), 0.0), 64.0) * 0.1;

    vec3 finalColor = texColor.rgb * (ambient + diff) + vec3(spec);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Apply a dual-projection shader material to a mesh.
 * Projects front and back textures using world-space normals — no UVs needed.
 */
function applyProjectionMaterial(
  mesh: THREE.Mesh,
  frontUrl: string | undefined,
  backUrl: string | undefined,
  colorHex: string | undefined,
  invalidate: () => void
) {
  const geo = mesh.geometry as THREE.BufferGeometry;
  if (!geo) return;

  // Compute bounding box for UV normalization
  geo.computeBoundingBox();
  if (!geo.attributes.normal) geo.computeVertexNormals();

  const bbox = geo.boundingBox!;
  const bboxSize = new THREE.Vector3();
  bbox.getSize(bboxSize);
  if (bboxSize.x === 0) bboxSize.x = 1;
  if (bboxSize.y === 0) bboxSize.y = 1;

  const baseColor = new THREE.Color(colorHex || '#888888');

  // Dispose previous projection material if it exists
  if (mesh.userData._projectionMat) {
    (mesh.userData._projectionMat as THREE.ShaderMaterial).dispose();
  }

  const uniforms = {
    frontMap:    { value: null as THREE.Texture | null },
    backMap:     { value: null as THREE.Texture | null },
    hasFrontMap: { value: false },
    hasBackMap:  { value: false },
    baseColor:   { value: baseColor },
    bboxMin:     { value: bbox.min.clone() },
    bboxSize:    { value: bboxSize },
  };

  const shaderMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: dualProjectionVertex,
    fragmentShader: dualProjectionFragment,
    side: THREE.DoubleSide,
  });

  mesh.material = shaderMat;
  mesh.userData._projectionMat = shaderMat;

  // Load textures asynchronously
  if (frontUrl) {
    loadTextureAsCanvas(frontUrl, colorHex, (tex) => {
      uniforms.frontMap.value = tex;
      uniforms.hasFrontMap.value = true;
      shaderMat.needsUpdate = true;
      invalidate();
    });
  }

  if (backUrl) {
    loadTextureAsCanvas(backUrl, colorHex, (tex) => {
      uniforms.backMap.value = tex;
      uniforms.hasBackMap.value = true;
      shaderMat.needsUpdate = true;
      invalidate();
    });
  }

  // If no textures at all, just show the base color
  if (!frontUrl && !backUrl) {
    shaderMat.needsUpdate = true;
    invalidate();
  }
}

/**
 * Apply texture/color to all meshes in the scene graph.
 * - Solid color: tints the existing material.
 * - Texture: uses dual-projection shader for full coverage.
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
    if (!mat) return;

    // Store original material on first encounter
    if (!mesh.userData._origMat) {
      mesh.userData._origMat = (mat as THREE.MeshStandardMaterial).clone();
    }

    if (textureUrl) {
      // ── TEXTURE VARIANT: dual projection shader ──
      applyProjectionMaterial(mesh, textureUrl, backTextureUrl, colorHex, invalidate);
    } else {
      // ── SOLID COLOR or RESTORE ORIGINAL ──
      // If we previously applied a projection shader, restore the original material
      if (mesh.userData._projectionMat) {
        (mesh.userData._projectionMat as THREE.ShaderMaterial).dispose();
        mesh.userData._projectionMat = null;
        const restored = (mesh.userData._origMat as THREE.MeshStandardMaterial).clone();
        mesh.material = restored;
      }

      // Clone material once so we don't mutate shared materials
      if (!mesh.userData._clonedMat) {
        const cloned = (mesh.material as THREE.MeshStandardMaterial).clone();
        mesh.userData._clonedMat = true;
        mesh.material = cloned;
      }

      const activeMat = mesh.material as THREE.MeshStandardMaterial;
      if (colorHex) {
        activeMat.color.set(colorHex);
      } else if (mesh.userData._origMat) {
        activeMat.color.copy((mesh.userData._origMat as THREE.MeshStandardMaterial).color);
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
  avatarUrl,
  scale = [1, 1, 1]
}: { 
  url: string; 
  className?: string;
  colorHex?: string;
  textureUrl?: string;
  backTextureUrl?: string;
  avatarUrl?: string;
  scale?: [number, number, number];
}) {
  if (!url) return <div className={`h-full w-full flex items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 text-muted-foreground ${className || 'min-h-[500px]'}`}>Modelo 3D no disponible</div>;

  return (
    <ErrorBoundary>
      <div className={`w-full h-full bg-gradient-to-b from-background/80 to-background/20 rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl ${className || 'min-h-[500px]'}`}>
        <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 0, 15], fov: 45 }}>
          <Suspense fallback={<ModelLoader />}>
            <Stage environment="city" intensity={0.8} adjustCamera>
              {avatarUrl && (
                <Model url={avatarUrl} />
              )}
              <Model url={url} colorHex={colorHex} textureUrl={textureUrl} backTextureUrl={backTextureUrl} scale={scale} />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-6 py-3 bg-background/80 backdrop-blur-xl rounded-full border border-white/10 text-xs font-medium text-muted-foreground shadow-lg">
          <span className="flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> Arrastra para rotar</span>
          <span className="flex items-center gap-2"><ZoomIn className="w-4 h-4" /> Rueda para zoom</span>
        </div>
      </div>
    </ErrorBoundary>
  );
}
