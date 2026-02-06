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

interface UseAudioRecordingReturn {
  isRecording: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  hasRecording: boolean;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playRecording: () => Promise<void>;
  pauseRecording: () => void;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [isSupported, practiceLogId, userId, index, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

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
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    deleteRecording,
  };
}
