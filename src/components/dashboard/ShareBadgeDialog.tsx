import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Share2, Copy, Flame } from "lucide-react";
import { EnamelBadge, BADGE_CONFIG } from "./BadgeShelf";

interface Badge {
  id: string;
  badge_type: string;
  earned_at: string;
}

interface ShareBadgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badgeConfig: (typeof BADGE_CONFIG)[0];
  earned: Badge;
  streak: number;
}

export function ShareBadgeDialog({
  open,
  onOpenChange,
  badgeConfig,
  earned,
  streak,
}: ShareBadgeDialogProps) {
  const shareMessage = `I earned the ${badgeConfig.label} streak badge on Practice Daily! 🔥 Currently on a ${streak}-day practice streak. Track your music practice journey at Practicedaily.app`;

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}&u=${encodeURIComponent("https://practicedaily.app")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleInstagram = async () => {
    await navigator.clipboard.writeText(shareMessage);
    toast({ title: "Text copied!", description: "Paste it on Instagram" });
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const handleTikTok = async () => {
    await navigator.clipboard.writeText(shareMessage);
    toast({ title: "Text copied!", description: "Paste it on TikTok" });
    window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareMessage);
    toast({ title: "Copied!", description: "Share text copied to clipboard" });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Practice Daily Streak",
          text: shareMessage,
          url: "https://practicedaily.app",
        });
      } catch {
        // user cancelled
      }
    }
  };

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Share Your Achievement</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Badge visual — scaled up */}
          <div className="mt-6 mb-14" style={{ transform: "scale(1.8)" }}>
            <EnamelBadge config={badgeConfig} earned={earned} />
          </div>

          {/* Streak */}
          <p className="text-2xl font-bold text-foreground text-center">
            {streak}-day streak
          </p>

          {/* Branding */}
          <div className="text-center space-y-1">
            <p className="text-3xl font-display font-bold text-foreground">
              Practice Daily
            </p>
            <p className="text-base text-muted-foreground">Your Personal Practice Journal</p>
            <p className="text-lg text-muted-foreground">Practicedaily.app</p>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2 w-full pt-2">
            <Button variant="outline" onClick={handleTwitter} className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter/X
            </Button>

            <Button variant="outline" onClick={handleFacebook} className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>

            <Button variant="outline" onClick={handleInstagram} className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagram
            </Button>

            <Button variant="outline" onClick={handleTikTok} className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z" />
              </svg>
              TikTok
            </Button>

            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Text
            </Button>

            {supportsNativeShare && (
              <Button variant="outline" onClick={handleNativeShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
