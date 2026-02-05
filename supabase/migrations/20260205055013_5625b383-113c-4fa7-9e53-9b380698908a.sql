-- Create table for staff paper drawings
CREATE TABLE public.staff_paper_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  drawing_date DATE NOT NULL,
  drawing_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, drawing_date)
);

-- Enable Row Level Security
ALTER TABLE public.staff_paper_drawings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own staff paper drawings" 
ON public.staff_paper_drawings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staff paper drawings" 
ON public.staff_paper_drawings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staff paper drawings" 
ON public.staff_paper_drawings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own staff paper drawings" 
ON public.staff_paper_drawings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_staff_paper_drawings_updated_at
BEFORE UPDATE ON public.staff_paper_drawings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();