import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseAudioRecordingOptions {
  userId: string;
  practiceLogId: string | undefined;
  index: number;
  existingRecordingPath: string | null;
  onRecordingComplete: (path: string) => void;
  onRecordingDeleted: () => void;
}

const MAX_RECORDING_SECONDS = 300; // 5 minutes

interface UseAudioRecordingReturn {
  isRecording: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  hasRecording: boolean;
  isSupported: boolean;
  recordingDuration: number;
  maxRecordingSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playRecording: () => Promise<void>;
  pauseRecording: () => void;
  downloadRecording: () => Promise<void>;
  deleteRecording: () => Promise<void>;
}

export function useAudioRecording({
  userId,
  practiceLogId,
  index,
  existingRecordingPath,
  onRecordingComplete,
  onRecordingDeleted,
}: UseAudioRecordingOptions): UseAudioRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const hasRecording = !!existingRecordingPath && existingRecordingPath.length > 0;

  // Fetch signed URL for existing recording
  useEffect(() => {
    if (existingRecordingPath && existingRecordingPath.length > 0) {
      const fetchSignedUrl = async () => {
        const { data, error } = await supabase.storage
          .from("practice-recordings")
          .createSignedUrl(existingRecordingPath, 3600); // 1 hour

        if (data && !error) {
          setAudioUrl(data.signedUrl);
        }
      };
      fetchSignedUrl();
    } else {
      setAudioUrl(null);
    }
  }, [existingRecordingPath]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported || !practiceLogId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsLoading(true);
        const mimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Upload to storage
        const extension = mimeType.includes("webm") ? "webm" : "m4a";
        const filePath = `${userId}/${practiceLogId}/repertoire-${index}.${extension}`;

        const { error } = await supabase.storage
          .from("practice-recordings")
          .upload(filePath, audioBlob, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!error) {
          onRecordingComplete(filePath);
        }

        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setIsLoading(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer to track duration and auto-stop at limit
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= MAX_RECORDING_SECONDS - 1) {
            // Will trigger stopRecording via the effect below
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [isSupported, practiceLogId, userId, index, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setRecordingDuration(0);
  }, [isRecording]);

  // Auto-stop when max duration reached
  useEffect(() => {
    if (recordingDuration >= MAX_RECORDING_SECONDS && isRecording) {
      stopRecording();
    }
  }, [recordingDuration, isRecording, stopRecording]);

  const playRecording = useCallback(async () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }, [audioUrl]);

  const pauseRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const downloadRecording = useCallback(async () => {
    if (!audioUrl) return;
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const extension = blob.type.includes("webm") ? "webm" : "m4a";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${index + 1}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading recording:", error);
    }
  }, [audioUrl, index]);

  const deleteRecording = useCallback(async () => {
    if (!existingRecordingPath) return;

    setIsLoading(true);

    const { error } = await supabase.storage
      .from("practice-recordings")
      .remove([existingRecordingPath]);

    if (!error) {
      setAudioUrl(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      onRecordingDeleted();
    }

    setIsLoading(false);
  }, [existingRecordingPath, onRecordingDeleted]);

  return {
    isRecording,
    isPlaying,
    isLoading,
    hasRecording,
    isSupported,
    recordingDuration,
    maxRecordingSeconds: MAX_RECORDING_SECONDS,
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    downloadRecording,
    deleteRecording,
  };
}
