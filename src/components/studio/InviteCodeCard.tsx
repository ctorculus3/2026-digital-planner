import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link } from "lucide-react";

interface Props {
  studioName: string;
  inviteCode: string;
  studentCount: number;
  maxStudents: number;
}

export function InviteCodeCard({ studioName, inviteCode, studentCount, maxStudents }: Props) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const joinLink = `${window.location.origin}/join/${inviteCode}`;

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="border-primary/20 bg-card">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{studioName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {studentCount} / {maxStudents} students
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-md">
                {inviteCode}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(inviteCode, "code")}
                className="h-9 w-9"
              >
                {copied === "code" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(joinLink, "link")}
              className="text-xs gap-1 justify-start"
            >
              {copied === "link" ? <Check className="h-3 w-3 text-primary" /> : <Link className="h-3 w-3" />}
              {copied === "link" ? "Link copied!" : "Copy join link"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
