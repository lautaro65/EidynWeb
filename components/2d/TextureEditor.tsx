"use client";

import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect, Line, Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { useTranslations } from "next-intl";
import { MousePointer2, Eraser, AlignCenter, Maximize, Trash2, RotateCcw } from "lucide-react";

interface TextureEditorProps {
  onTextureUpdate: (dataUrl: string) => void;
  baseColor: string;
  imageUrl?: string;
}

export default function TextureEditor({
  onTextureUpdate,
  baseColor,
  imageUrl,
}: TextureEditorProps) {
  const t = useTranslations("GarmentsNew");
  const stageRef = useRef<Konva.Stage>(null);
  
  interface LineData {
    tool: "eraser" | "move";
    color: string;
    size: number;
    points: number[];
  }
  const [lines, setLines] = useState<LineData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"eraser" | "move">("move");
  const [brushSize, setBrushSize] = useState(5);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [img] = useImage(imageUrl || "", "anonymous");
  const trRef = useRef<Konva.Transformer>(null);
  const imageRef = useRef<Konva.Image>(null);

  const [showImage, setShowImage] = useState(!!imageUrl);
  const [prevImageUrl, setPrevImageUrl] = useState(imageUrl);
  
  if (imageUrl !== prevImageUrl) {
    setPrevImageUrl(imageUrl);
    setShowImage(!!imageUrl);
  }

  const [imageNode, setImageNode] = useState({
    x: 128,
    y: 128,
    width: 256,
    height: 256,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  });

  // Update parent when lines change
  useEffect(() => {
    if (stageRef.current) {
      // Temporarily hide transformer before exporting
      const tr = trRef.current;
      if (tr) tr.nodes([]);
      
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      onTextureUpdate(dataUrl);

      // Restore transformer
      if (tr && selectedId === 'image' && imageRef.current) {
        tr.nodes([imageRef.current]);
      }
    }
  }, [lines, baseColor, img, selectedId, onTextureUpdate]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // If we click on transformer, let it do its thing
    const isTransformer = e.target.getParent()?.className === 'Transformer';
    if (isTransformer) {
      return;
    }

    // If eraser, start drawing regardless of what we clicked on
    if (tool === 'eraser') {
      setSelectedId(null);
      setIsDrawing(true);
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      setLines([...lines, { tool, color: "transparent", size: brushSize, points: [pos.x, pos.y] }]);
      return;
    }

    // If move tool
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
    if (clickedOnEmpty) {
      setSelectedId(null);
    } else {
      const name = e.target.name();
      if (name === 'image') {
        setSelectedId(name);
      } else {
        setSelectedId(null);
      }
    }
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
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl shadow-lg backdrop-blur-md">
        
        {/* Core Tools */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setTool("move")} 
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${tool === "move" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-white/10 text-muted-foreground hover:text-white"}`}
            title="Mover y Ajustar"
          >
            <MousePointer2 className="w-4 h-4" />
            <span className="hidden sm:inline">Mover</span>
          </button>
          <button 
            onClick={() => setTool("eraser")} 
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${tool === "eraser" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-white/10 text-muted-foreground hover:text-white"}`}
            title="Borrar secciones de la imagen"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Goma</span>
          </button>
        </div>
        
        {/* Brush Size (only if eraser selected) */}
        <div className={`flex items-center gap-3 px-4 py-2 bg-black/20 rounded-xl border border-white/5 transition-opacity ${tool === 'eraser' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="w-2 h-2 rounded-full bg-white/50" />
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-20 accent-primary"
          />
          <div className="w-4 h-4 rounded-full bg-white" />
        </div>

        {/* Image Actions */}
        {img && showImage && (
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5 ml-auto">
            <button 
              onClick={() => {
                setImageNode({ x: 176, y: 176, width: 160, height: 160, rotation: 0, scaleX: 1, scaleY: 1 });
                setLines([...lines]);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-transparent hover:bg-white/10 rounded-lg transition-all text-white/80 hover:text-white"
              title="Centrar Logo"
            >
              <AlignCenter className="w-4 h-4" />
              <span className="hidden sm:inline">Centrar Logo</span>
            </button>
            <button 
              onClick={() => {
                setImageNode({ x: 0, y: 0, width: 512, height: 512, rotation: 0, scaleX: 1, scaleY: 1 });
                setLines([...lines]);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-transparent hover:bg-white/10 rounded-lg transition-all text-white/80 hover:text-white"
              title="Cubrir Todo"
            >
              <Maximize className="w-4 h-4" />
              <span className="hidden sm:inline">Cubrir Todo</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button 
              onClick={() => { setShowImage(false); setSelectedId(null); setLines([...lines]); }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-transparent hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all"
              title="Eliminar Imagen"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>
        )}

        {/* Clear Canvas Action */}
        <button 
          onClick={clearCanvas} 
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20 ${!img || !showImage ? 'ml-auto' : ''}`}
          title="Limpiar todo el lienzo"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden xl:inline">Limpiar Lienzo</span>
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
            <Rect x={0} y={0} width={512} height={512} fill={baseColor} name="background" />
            
            {/* Image Proxy */}
            {img && showImage && (
              <KonvaImage 
                ref={imageRef}
                image={img} 
                x={imageNode.x}
                y={imageNode.y}
                width={imageNode.width}
                height={imageNode.height}
                rotation={imageNode.rotation}
                scaleX={imageNode.scaleX}
                scaleY={imageNode.scaleY}
                draggable={tool === "move"}
                name="image"
                onClick={() => {
                  if (tool === "move") setSelectedId('image');
                }}
                onTap={() => {
                  if (tool === "move") setSelectedId('image');
                }}
                onDragEnd={(e) => {
                  setImageNode({
                    ...imageNode,
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                  // Trigger re-render to update texture
                  setLines([...lines]);
                }}
                onTransformEnd={() => {
                  const node = imageRef.current;
                  if (node) {
                    setImageNode({
                      ...imageNode,
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      scaleX: node.scaleX(),
                      scaleY: node.scaleY(),
                    });
                  }
                  setLines([...lines]);
                }}
              />
            )}

            {/* Transformer for Resizing/Rotating */}
            {selectedId && (
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
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

        {/* T-Shirt Silhouette Overlay Mask */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 512 512" className="w-full h-full opacity-80">
            <path 
              d="M0,0 L512,0 L512,512 L0,512 Z M170,50 Q256,120 342,50 L480,100 L440,260 L380,220 L360,500 L152,500 L132,220 L72,260 L32,100 Z" 
              fill="#000" 
              fillRule="evenodd" 
            />
          </svg>
        </div>

      </div>
    </div>
  );
}
