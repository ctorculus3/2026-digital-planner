import { useEffect } from "react";
import { PracticeLogCalendar } from "@/components/practice-log/PracticeLogCalendar";

const Index = () => {
  useEffect(() => { document.title = "Practice Journal — Practice Daily"; }, []);
  return <PracticeLogCalendar />;
};

export default Index;
