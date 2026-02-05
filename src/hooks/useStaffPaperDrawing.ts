 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useDebounce } from "./useDebounce";
 import { format } from "date-fns";
 
 export function useStaffPaperDrawing(date: Date) {
   const { user } = useAuth();
   const [drawingData, setDrawingData] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   
   const debouncedDrawingData = useDebounce(drawingData, 1000);
   const dateString = format(date, "yyyy-MM-dd");
 
   // Load drawing data
   useEffect(() => {
     async function loadDrawing() {
       if (!user) return;
       
       setIsLoading(true);
       try {
         const { data, error } = await supabase
           .from("staff_paper_drawings")
           .select("drawing_data")
           .eq("user_id", user.id)
           .eq("drawing_date", dateString)
           .maybeSingle();
 
         if (error) throw error;
         setDrawingData(data?.drawing_data || null);
       } catch (error) {
         console.error("Error loading drawing:", error);
       } finally {
         setIsLoading(false);
       }
     }
 
     loadDrawing();
   }, [user, dateString]);
 
   // Auto-save drawing data
   useEffect(() => {
     async function saveDrawing() {
       if (!user || debouncedDrawingData === null || isLoading) return;
       
       setIsSaving(true);
       try {
         const { error } = await supabase
           .from("staff_paper_drawings")
           .upsert(
             {
               user_id: user.id,
               drawing_date: dateString,
               drawing_data: debouncedDrawingData,
             },
             {
               onConflict: "user_id,drawing_date",
             }
           );
 
         if (error) throw error;
       } catch (error) {
         console.error("Error saving drawing:", error);
       } finally {
         setIsSaving(false);
       }
     }
 
     saveDrawing();
   }, [user, debouncedDrawingData, dateString, isLoading]);
 
   const updateDrawing = useCallback((data: string) => {
     setDrawingData(data);
   }, []);
 
   const clearDrawing = useCallback(() => {
     setDrawingData("");
   }, []);
 
   return {
     drawingData,
     isLoading,
     isSaving,
     updateDrawing,
     clearDrawing,
   };
 }