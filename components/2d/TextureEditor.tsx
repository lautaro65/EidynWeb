"use client";

import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect, Line, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { useTranslations } from "next-intl";

interface TextureEditorProps {
  onTextureUpdate: (dataUrl: string) => void;
  baseColor: string;
  frontImageUrl?: string;
  backImageUrl?: string;
}

export default function TextureEditor({
  onTextureUpdate,
  baseColor,
  frontImageUrl,
  backImageUrl,
}: TextureEditorProps) {
  const t = useTranslations("GarmentsNew");
  const stageRef = useRef<Konva.Stage>(null);
  
  interface LineData {
    tool: "brush" | "eraser";
    color: string;
    size: number;
    points: number[];
  }
  const [lines, setLines] = useState<LineData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  
  const [frontImg] = useImage(frontImageUrl || "", "anonymous");
  const [backImg] = useImage(backImageUrl || "", "anonymous");

  // Removed mounted state as it is loaded via dynamic(ssr: false)

  // Update parent when lines change
  useEffect(() => {
    if (stageRef.current) {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      onTextureUpdate(dataUrl);
    }
  }, [lines, baseColor, frontImg, backImg, onTextureUpdate]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    setIsDrawing(true);
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    setLines([...lines, { tool, color: brushColor, size: brushSize, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;
    
    // Create new array to avoid mutating state directly
    const lastLine = { ...lines[lines.length - 1] };
    lastLine.points = [...lastLine.points, point.x, point.y];

    const newLines = [...lines];
    newLines.splice(lines.length - 1, 1, lastLine);
    setLines(newLines);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setLines([]);
  };

  // Render normally since ssr is false

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 border-r border-white/10 pr-4">
          <button 
            onClick={() => setTool("brush")} 
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tool === "brush" ? "bg-primary text-primary-foreground" : "hover:bg-white/10 text-muted-foreground"}`}
          >
            {t("brush")}
          </button>
          <button 
            onClick={() => setTool("eraser")} 
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tool === "eraser" ? "bg-primary text-primary-foreground" : "hover:bg-white/10 text-muted-foreground"}`}
          >
            {t("eraser")}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="color" 
            value={brushColor} 
            onChange={(e) => setBrushColor(e.target.value)}
            disabled={tool === "eraser"}
            className="w-6 h-6 rounded cursor-pointer disabled:opacity-50"
          />
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-primary"
          />
        </div>

        <button 
          onClick={clearCanvas} 
          className="ml-auto px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          {t("clearCanvas")}
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center relative">
        <Stage
          width={512}
          height={512}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
          className="bg-transparent shadow-2xl"
          style={{ width: "100%", height: "100%", maxWidth: 512, maxHeight: 512 }}
        >
          <Layer>
            {/* Base Color Background */}
            <Rect x={0} y={0} width={512} height={512} fill={baseColor} />
            
            {/* Front Image Proxy (Center) */}
            {frontImg && (
              <KonvaImage 
                image={frontImg} 
                x={128} 
                y={128} 
                width={256} 
                height={256} 
                draggable 
              />
            )}

            {/* Back Image Proxy (Top Left for example, in a real UV map it depends on the template) */}
            {backImg && (
              <KonvaImage 
                image={backImg} 
                x={10} 
                y={10} 
                width={128} 
                height={128} 
                draggable 
              />
            )}

            {/* Drawn Lines */}
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.tool === 'eraser' ? baseColor : line.color}
                strokeWidth={line.size}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
          </Layer>
        </Stage>

        {/* Overlay Grid/UV Helper */}
        <div className="absolute inset-0 pointer-events-none border border-dashed border-white/20 m-4 rounded" />
      </div>
    </div>
  );
}
