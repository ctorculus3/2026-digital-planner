-- Create practice_logs table to store daily practice entries
CREATE TABLE public.practice_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    goals TEXT,
    subgoals TEXT,
    start_time TIME,
    stop_time TIME,
    warmups TEXT[] DEFAULT ARRAY[]::TEXT[],
    scales TEXT[] DEFAULT ARRAY[]::TEXT[],
    repertoire TEXT[] DEFAULT ARRAY[]::TEXT[],
    technique TEXT,
    musicianship TEXT,
    notes TEXT,
    metronome_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, log_date)
);

-- Enable Row Level Security
ALTER TABLE public.practice_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own practice logs" 
ON public.practice_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice logs" 
ON public.practice_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice logs" 
ON public.practice_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice logs" 
ON public.practice_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_practice_logs_updated_at
BEFORE UPDATE ON public.practice_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();