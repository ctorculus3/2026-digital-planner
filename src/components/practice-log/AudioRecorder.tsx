import { useAudioRecording } from "@/hooks/useAudioRecording";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  practiceLogId: string | undefined;
  userId: string;
  index: number;
  existingRecordingPath: string | null;
  onRecordingComplete: (path: string) => void;
  onRecordingDeleted: () => void;
}

export function AudioRecorder({
  practiceLogId,
  userId,
  index,
  existingRecordingPath,
  onRecordingComplete,
  onRecordingDeleted,
}: AudioRecorderProps) {
  const {
    isRecording,
    isPlaying,
    isLoading,
    hasRecording,
    isSupported,
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    downloadRecording,
    deleteRecording,
  } = useAudioRecording({
    userId,
    practiceLogId,
    index,
    existingRecordingPath,
    onRecordingComplete,
    onRecordingDeleted,
  });

  // Hide if browser doesn't support recording or no practice log yet
  if (!isSupported || !practiceLogId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Currently recording
  if (isRecording) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={stopRecording}
        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Square className={cn("w-4 h-4 fill-current animate-pulse")} />
      </Button>
    );
  }

  // Has existing recording
  if (hasRecording) {
    return (
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={isPlaying ? pauseRecording : playRecording}
          className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={downloadRecording}
          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={deleteRecording}
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  // No recording - show record button
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={startRecording}
      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
    >
      <Mic className="w-4 h-4" />
    </Button>
  );
}
