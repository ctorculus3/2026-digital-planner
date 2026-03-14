import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link, Pencil, X, Loader2 } from "lucide-react";

interface Props {
  studioName: string;
  inviteCode: string;
  studentCount: number;
  maxStudents: number;
  onRename?: (newName: string) => Promise<void>;
}

export function InviteCodeCard({ studioName, inviteCode, studentCount, maxStudents, onRename }: Props) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(studioName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const joinLink = `${window.location.origin}/join/${inviteCode}`;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const startEditing = () => {
    setEditName(studioName);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditName(studioName);
    setEditing(false);
  };

  const saveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === studioName) {
      cancelEditing();
      return;
    }
    setSaving(true);
    try {
      await onRename?.(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEditing();
                  }}
                  disabled={saving}
                  className="text-xl font-bold h-9 max-w-[280px]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveEdit}
                  disabled={saving || !editName.trim()}
                  className="h-8 w-8"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-primary" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{studioName}</h2>
                {onRename && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startEditing}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title="Rename studio"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {studentCount} / {maxStudents} students
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-md">
                {inviteCode}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(inviteCode, "code")}
                className="h-9 w-9"
                title="Copy code"
              >
                {copied === "code" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md min-w-0">
                <Link className="h-3 w-3 shrink-0" />
                <span className="truncate select-all">{joinLink}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(joinLink, "link")}
                className="h-8 w-8 shrink-0"
                title="Copy join link"
              >
                {copied === "link" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
