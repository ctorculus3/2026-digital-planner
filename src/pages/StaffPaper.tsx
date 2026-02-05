 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { ArrowLeft } from "lucide-react";
 import { format, parseISO } from "date-fns";
 import { ScallopHeader } from "@/components/practice-log/ScallopHeader";
 
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
 
   const handleBackToJournal = () => {
     navigate(`/?date=${format(currentDate, "yyyy-MM-dd")}`);
   };
 
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
         <h1 className="font-display text-lg font-semibold text-foreground">
           Staff Paper
         </h1>
         <span className="text-sm text-muted-foreground font-display">
           {formattedDate}
         </span>
       </div>
 
       {/* Staff Paper Content */}
       <div className="flex-1 p-6 md:p-8 overflow-auto">
         <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-md p-6 md:p-8">
           {/* Staves - 10 sets of 5 lines each */}
          <div className="flex flex-col gap-16">
             {[...Array(10)].map((_, staveIndex) => (
               <StaffLines key={staveIndex} />
             ))}
           </div>
         </div>
       </div>
     </div>
   );
 }