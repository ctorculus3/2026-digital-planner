import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

const DRONE_NOTES = [
  ["C", "Db", "D", "Eb"],
  ["E", "F", "F#", "G"],
  ["Ab", "A", "Bb", "B"],
];

const FILE_MAP: Record<string, string> = {
  C: "drone-C.mp3",
  Db: "drone-Db.mp3",
  D: "drone-D.mp3",
  Eb: "drone-Eb.mp3",
  E: "drone-E.mp3",
  F: "drone-F.mp3",
  "F#": "drone-Gb.mp3",
  G: "drone-G.mp3",
  Ab: "drone-Ab.mp3",
  A: "drone-A.mp3",
  Bb: "drone-Bb.mp3",
  B: "drone-B.mp3",
};

export function DronePlayer() {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleNote = (note: string) => {
    if (activeNote === note) {
      // Stop current drone
      audioRef.current?.pause();
      audioRef.current = null;
      setActiveNote(null);
      return;
    }

    // Stop previous drone if any
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(`/audio/drones/${FILE_MAP[note]}`);
    audio.loop = true;
    audio.play();
    audioRef.current = audio;
    setActiveNote(note);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {DRONE_NOTES.map((row, ri) => (
        <div key={ri} className="grid grid-cols-4 gap-1.5">
          {row.map((note) => (
            <Button
              key={note}
              type="button"
              variant={activeNote === note ? "destructive" : "outline"}
              size="sm"
              className="text-sm h-10 font-semibold px-1 flex-1"
              onClick={() => handleNote(note)}
            >
              {note}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}
