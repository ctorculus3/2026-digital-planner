import { useRef, useEffect, useState, useCallback, PointerEvent } from "react";
 
 interface DrawingCanvasProps {
   width: number;
   height: number;
   drawingData: string | null;
   onDrawingChange: (data: string) => void;
   isLoading: boolean;
 }
 
interface Point {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
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
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const lastDrawingDataRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const snapshotTimerRef = useRef<number | null>(null);
 
  // Load existing drawing data or redraw when dimensions change
   useEffect(() => {
    if (isLoading) return;

     const canvas = canvasRef.current;
     if (!canvas) return;

     const ctx = canvas.getContext("2d");
     if (!ctx) return;
 
    // Determine what data to draw
    const dataToLoad = hasInitializedRef.current ? lastDrawingDataRef.current : drawingData;
 
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (dataToLoad) {
       const img = new Image();
       img.onload = () => {
         ctx.drawImage(img, 0, 0);
       };
      img.src = dataToLoad;
     }

    // Mark as initialized after first load
    if (!hasInitializedRef.current && !isLoading) {
      hasInitializedRef.current = true;
      lastDrawingDataRef.current = drawingData;
    }
  }, [drawingData, width, height, isLoading]);
 
  const getPoint = useCallback((e: PointerEvent<HTMLCanvasElement>): Point | null => {
     const canvas = canvasRef.current;
     if (!canvas) return null;
 
     const rect = canvas.getBoundingClientRect();
     const scaleX = canvas.width / rect.width;
     const scaleY = canvas.height / rect.height;
 
    // Use coalesced events for smoother Apple Pencil strokes
    const coalescedEvents = e.nativeEvent.getCoalescedEvents?.() || [e.nativeEvent];
    const primaryEvent = coalescedEvents[coalescedEvents.length - 1] || e.nativeEvent;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      // Apple Pencil pressure (0.0 to 1.0), default 0.5 for mouse
      pressure: e.pressure > 0 ? e.pressure : 0.5,
      // Tilt angles for Apple Pencil (-90 to 90 degrees)
      tiltX: e.tiltX || 0,
      tiltY: e.tiltY || 0,
    };
   }, []);
 
  const startDrawing = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
     e.preventDefault();
    
    // Palm rejection: only respond to pen or mouse, ignore touch (finger)
    if (e.pointerType === "touch") return;

     const point = getPoint(e);
     if (!point) return;
     
    // Capture pointer for reliable tracking
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }
    
     setIsDrawing(true);
     setLastPoint(point);
   }, [getPoint]);
 
  const draw = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
     e.preventDefault();
    
    // Palm rejection
    if (e.pointerType === "touch") return;
    
     if (!isDrawing || !lastPoint) return;
 
     const canvas = canvasRef.current;
     if (!canvas) return;
 
     const ctx = canvas.getContext("2d");
     if (!ctx) return;
 
    // Process coalesced events for smoother Apple Pencil strokes
    const coalescedEvents = e.nativeEvent.getCoalescedEvents?.() || [e];
    
    let currentPoint = lastPoint;
    
    for (const coalescedEvent of coalescedEvents) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const point: Point = {
        x: ((coalescedEvent as PointerEvent).clientX - rect.left) * scaleX,
        y: ((coalescedEvent as PointerEvent).clientY - rect.top) * scaleY,
        pressure: (coalescedEvent as PointerEvent).pressure > 0 
          ? (coalescedEvent as PointerEvent).pressure 
          : 0.5,
        tiltX: (coalescedEvent as PointerEvent).tiltX || 0,
        tiltY: (coalescedEvent as PointerEvent).tiltY || 0,
      };

      // Calculate line width based on pressure (1-6px range)
      const baseWidth = 1.5;
      const pressureWidth = baseWidth + (point.pressure * 4);
      
      // Slight width variation based on tilt (simulates pencil angle)
      const tiltFactor = Math.abs(point.tiltX) + Math.abs(point.tiltY);
      const tiltWidth = pressureWidth + (tiltFactor / 90) * 1.5;

      ctx.beginPath();
      ctx.moveTo(currentPoint.x, currentPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = "hsl(var(--foreground))";
      ctx.lineWidth = Math.min(tiltWidth, 8); // Cap at 8px
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      currentPoint = point;
    }

    setLastPoint(currentPoint);

    // Keep a recent snapshot so any resize/redraw can restore in-progress work
    // (throttled to avoid excessive toDataURL calls)
    if (snapshotTimerRef.current == null) {
      snapshotTimerRef.current = window.setTimeout(() => {
        snapshotTimerRef.current = null;
        const c = canvasRef.current;
        if (!c) return;
        try {
          lastDrawingDataRef.current = c.toDataURL("image/png");
        } catch {
          // ignore
        }
      }, 400);
    }
   }, [isDrawing, lastPoint, getPoint]);
 
  const stopDrawing = useCallback((e?: PointerEvent<HTMLCanvasElement>) => {
     if (isDrawing) {
       setIsDrawing(false);
       setLastPoint(null);

      if (snapshotTimerRef.current != null) {
        window.clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }

      // Release pointer capture
      if (e) {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.releasePointerCapture(e.pointerId);
        }
      }

       // Save the canvas data
       const canvas = canvasRef.current;
       if (canvas) {
         const data = canvas.toDataURL("image/png");
        lastDrawingDataRef.current = data;
         onDrawingChange(data);
       }
     }
   }, [isDrawing, onDrawingChange]);
 
   return (
     <canvas
       ref={canvasRef}
       width={width}
       height={height}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      style={{ 
        touchAction: "none",
        // Disable iOS Scribble on canvas
        // @ts-ignore - WebKit specific property
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      // Use Pointer Events for Apple Pencil support
      onPointerDown={startDrawing}
      onPointerMove={draw}
      onPointerUp={stopDrawing}
      onPointerLeave={() => stopDrawing()}
      onPointerCancel={() => stopDrawing()}
      // Prevent default touch behaviors
      onTouchStart={(e) => e.preventDefault()}
     />
   );
 }