"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Environment, OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { OBJLoader } from "three-stdlib";

function ObjModel({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url);
  const copiedObj = useMemo(() => obj.clone(), [obj]);
  return <primitive object={copiedObj} />;
}

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Model({ url }: { url: string }) {
  const isObj = url.toLowerCase().endsWith('.obj');
  
  // Ensure the URL is absolute so next-intl or relative routing doesn't append '/es/' to it
  const absoluteUrl = typeof window !== 'undefined' && url.startsWith('/') 
    ? `${window.location.origin}${url}` 
    : url;
  
  return isObj ? <ObjModel url={absoluteUrl} /> : <GlbModel url={absoluteUrl} />;
}

export function GarmentViewer({ url }: { url: string }) {
  if (!url) return <div className="h-full w-full min-h-[500px] flex items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 text-muted-foreground">Modelo 3D no disponible</div>;

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-background/80 to-background/20 rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} adjustCamera>
            <Model url={url} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />
      </Canvas>
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center px-6 py-3 bg-background/80 backdrop-blur-xl rounded-full border border-white/10 text-xs font-medium text-muted-foreground shadow-lg">
        <span className="flex items-center gap-2"><span>🖱️</span> Arrastra para rotar</span>
        <span className="flex items-center gap-2"><span>🔍</span> Rueda para zoom</span>
      </div>
    </div>
  );
}
