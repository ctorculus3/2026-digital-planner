 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Loader2, Save, Pencil, Eraser } from "lucide-react";
 import { format, parseISO } from "date-fns";
 import { ScallopHeader } from "@/components/practice-log/ScallopHeader";
import { DrawingCanvas } from "@/components/staff-paper/DrawingCanvas";
import { useStaffPaperDrawing } from "@/hooks/useStaffPaperDrawing";
import { useRef, useState, useEffect, useCallback } from "react";
 
 function StaffLines() {
   return (
    <div className="flex flex-col gap-4">
       {[...Array(5)].map((_, i) => (
         <div key={i} className="h-px bg-foreground/80 w-full" />
       ))}
     </div>
   );
 }
 
 export default function StaffPaper() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const dateParam = searchParams.get("date");
   
   const currentDate = dateParam ? parseISO(dateParam) : new Date();
   const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");
   
   const containerRef = useRef<HTMLDivElement>(null);
   const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1200 });
  const [isErasing, setIsErasing] = useState(false);
   
  const { drawingData, isLoading, isSaving, hasUnsavedChanges, updateDrawing, clearDrawing, saveDrawing } = 
      useStaffPaperDrawing(currentDate);
 
  const toggleEraser = useCallback(() => {
    setIsErasing(prev => !prev);
  }, []);

   const handleBackToJournal = () => {
     navigate(`/?date=${format(currentDate, "yyyy-MM-dd")}`);
   };
 
   // Measure container size for canvas
   useEffect(() => {
     const container = containerRef.current;
     if (!container) return;

      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const last = { width: 0, height: 0 };

      const updateSize = (rect: DOMRectReadOnly | DOMRect) => {
        // Ignore tiny viewport changes (iPad address bar / elastic scrolling)
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (Math.abs(w - last.width) < 6 && Math.abs(h - last.height) < 6) return;
        last.width = w;
        last.height = h;

        setCanvasSize({
          width: Math.round(w * dpr),
          height: Math.round(h * dpr),
        });
      };

      updateSize(container.getBoundingClientRect());

      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        updateSize(entry.contentRect);
      });

      ro.observe(container);
      return () => ro.disconnect();
   }, []);
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <ScallopHeader />
       
       {/* Header Bar */}
       <div className="bg-muted border-b border-border px-4 py-3 flex items-center justify-between">
         <Button
           variant="ghost"
           onClick={handleBackToJournal}
           className="flex items-center gap-2"
         >
           <ArrowLeft className="h-4 w-4" />
           Back to Journal
         </Button>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-lg font-semibold text-foreground">
            Staff Paper
          </h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">(unsaved)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-display">
            {formattedDate}
          </span>
          <Button
            variant={isErasing ? "default" : "outline"}
            size="sm"
            onClick={toggleEraser}
            title={isErasing ? "Switch to pen (double-tap pencil)" : "Switch to eraser (double-tap pencil)"}
            className="flex items-center gap-1"
          >
            {isErasing ? (
              <Eraser className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={saveDrawing}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearDrawing}
            title="Clear drawing"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
       </div>
 
       {/* Staff Paper Content */}
       <div className="flex-1 p-6 md:p-8 overflow-auto">
        <div 
          ref={containerRef}
          className="max-w-4xl mx-auto bg-card rounded-lg shadow-md p-6 md:p-8 relative"
        >
          {/* Staves - 8 sets of 5 lines each */}
          <div className="flex flex-col gap-16 relative z-0">
            {[...Array(8)].map((_, staveIndex) => (
              <StaffLines key={staveIndex} />
            ))}
          </div>
          
          {/* Drawing Canvas Overlay */}
          <div className="absolute inset-0 z-10">
            <DrawingCanvas
              width={canvasSize.width}
              height={canvasSize.height}
              drawingData={drawingData}
              onDrawingChange={updateDrawing}
              isLoading={isLoading}
              isErasing={isErasing}
              onToggleEraser={toggleEraser}
            />
           </div>
         </div>
       </div>
     </div>
   );
 }