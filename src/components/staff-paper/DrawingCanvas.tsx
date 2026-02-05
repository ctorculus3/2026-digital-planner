 import { useRef, useEffect, useState, useCallback } from "react";
 
 interface DrawingCanvasProps {
   width: number;
   height: number;
   drawingData: string | null;
   onDrawingChange: (data: string) => void;
   isLoading: boolean;
 }
 
 export function DrawingCanvas({
   width,
   height,
   drawingData,
   onDrawingChange,
   isLoading,
 }: DrawingCanvasProps) {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [isDrawing, setIsDrawing] = useState(false);
   const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
   const [hasLoaded, setHasLoaded] = useState(false);
 
   // Load existing drawing data
   useEffect(() => {
     if (isLoading || hasLoaded) return;
     
     const canvas = canvasRef.current;
     if (!canvas) return;
     
     const ctx = canvas.getContext("2d");
     if (!ctx) return;
 
     // Clear canvas first
     ctx.clearRect(0, 0, width, height);
 
     if (drawingData) {
       const img = new Image();
       img.onload = () => {
         ctx.drawImage(img, 0, 0);
         setHasLoaded(true);
       };
       img.src = drawingData;
     } else {
       setHasLoaded(true);
     }
   }, [drawingData, width, height, isLoading, hasLoaded]);
 
   const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
     const canvas = canvasRef.current;
     if (!canvas) return null;
 
     const rect = canvas.getBoundingClientRect();
     const scaleX = canvas.width / rect.width;
     const scaleY = canvas.height / rect.height;
 
     if ("touches" in e) {
       const touch = e.touches[0];
       return {
         x: (touch.clientX - rect.left) * scaleX,
         y: (touch.clientY - rect.top) * scaleY,
       };
     } else {
       return {
         x: (e.clientX - rect.left) * scaleX,
         y: (e.clientY - rect.top) * scaleY,
       };
     }
   }, []);
 
   const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
     e.preventDefault();
     const point = getPoint(e);
     if (!point) return;
     
     setIsDrawing(true);
     setLastPoint(point);
   }, [getPoint]);
 
   const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
     e.preventDefault();
     if (!isDrawing || !lastPoint) return;
 
     const canvas = canvasRef.current;
     if (!canvas) return;
 
     const ctx = canvas.getContext("2d");
     if (!ctx) return;
 
     const point = getPoint(e);
     if (!point) return;
 
     ctx.beginPath();
     ctx.moveTo(lastPoint.x, lastPoint.y);
     ctx.lineTo(point.x, point.y);
     ctx.strokeStyle = "hsl(var(--foreground))";
     ctx.lineWidth = 2;
     ctx.lineCap = "round";
     ctx.lineJoin = "round";
     ctx.stroke();
 
     setLastPoint(point);
   }, [isDrawing, lastPoint, getPoint]);
 
   const stopDrawing = useCallback(() => {
     if (isDrawing) {
       setIsDrawing(false);
       setLastPoint(null);
       
       // Save the canvas data
       const canvas = canvasRef.current;
       if (canvas) {
         const data = canvas.toDataURL("image/png");
         onDrawingChange(data);
       }
     }
   }, [isDrawing, onDrawingChange]);
 
   return (
     <canvas
       ref={canvasRef}
       width={width}
       height={height}
       className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
       style={{ touchAction: "none" }}
       onMouseDown={startDrawing}
       onMouseMove={draw}
       onMouseUp={stopDrawing}
       onMouseLeave={stopDrawing}
       onTouchStart={startDrawing}
       onTouchMove={draw}
       onTouchEnd={stopDrawing}
     />
   );
 }