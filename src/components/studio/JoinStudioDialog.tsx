import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: (code: string) => Promise<any>;
}

export function JoinStudioDialog({ open, onOpenChange, onJoin }: Props) {
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoining(true);
    try {
      const result = await onJoin(code.trim());
      toast({ title: `Joined ${result.studio_name}!` });
      setCode("");
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: err.message || "Could not join studio", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Studio</DialogTitle>
          <DialogDescription>
            Enter the 6-character invite code from your teacher.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="e.g. ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={6}
            className="font-mono text-center text-lg tracking-widest"
            disabled={joining}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={joining}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={code.trim().length < 6 || joining}>
            {joining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
