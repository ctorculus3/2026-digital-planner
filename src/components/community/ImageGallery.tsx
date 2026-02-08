import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function getPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/community-images/${path}`;
}

interface ImageGalleryProps {
  imagePaths: string[];
}

export function ImageGallery({ imagePaths }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!imagePaths || imagePaths.length === 0) return null;

  const count = imagePaths.length;

  return (
    <>
      <div
        className={`mt-2 pl-11 gap-1.5 rounded-lg overflow-hidden ${
          count === 1
            ? "grid grid-cols-1"
            : "grid grid-cols-2"
        }`}
      >
        {imagePaths.map((path, i) => (
          <button
            key={path}
            type="button"
            className="relative overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setLightboxIndex(i)}
          >
            <img
              src={getPublicUrl(path)}
              alt={`Post image ${i + 1}`}
              className={`w-full object-cover ${
                count === 1 ? "max-h-80" : "h-40"
              }`}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={() => setLightboxIndex(null)}
      >
        <DialogContent className="max-w-3xl p-2 bg-background/95 border-border">
          {lightboxIndex !== null && (
            <img
              src={getPublicUrl(imagePaths[lightboxIndex])}
              alt={`Post image ${lightboxIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
