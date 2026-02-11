import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy, Loader2, Check } from "lucide-react";
import { useSharePracticeLog } from "@/hooks/useSharePracticeLog";
import { useToast } from "@/hooks/use-toast";

type ExpirationOption = {
  label: string;
  days: number | null;
};

const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { label: "Never", days: null },
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
];

interface ShareButtonProps {
  practiceLogId: string | undefined;
  disabled?: boolean;
}

export function ShareButton({ practiceLogId, disabled }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedExpiration, setSelectedExpiration] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLinkView, setShowLinkView] = useState(false);
  const { toast } = useToast();

  const {
    isLoading,
    shareData,
    fetchExistingShare,
    createShare,
    revokeShare,
    getShareUrl,
  } = useSharePracticeLog(practiceLogId);

  useEffect(() => {
    if (open && practiceLogId) {
      setShowLinkView(false);
      fetchExistingShare();
    }
  }, [open, practiceLogId]);

  const handleGenerateLink = async () => {
    const result = await createShare(selectedExpiration);
    if (result) setShowLinkView(true);
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async () => {
    const revoked = await revokeShare();
    if (revoked) setShowLinkView(false);
  };

  const shareUrl = getShareUrl();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !practiceLogId}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Practice Log</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : showLinkView && shareData ? (
            <>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can view your practice log:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl || ""}
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border border-border truncate"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {shareData.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(shareData.expires_at).toLocaleDateString()}
                </p>
              )}
              <div className="flex justify-between pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevoke}
                >
                  Revoke Access
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              {shareData && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                  <p className="text-sm text-muted-foreground">You already have an active link.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLinkView(true)}
                  >
                    View Link
                  </Button>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Link expires:
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPIRATION_OPTIONS.map((option) => (
                    <Button
                      key={option.label}
                      variant={selectedExpiration === option.days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedExpiration(option.days)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleGenerateLink}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Generate Link
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
