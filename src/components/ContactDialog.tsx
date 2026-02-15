import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ContactDialogProps {
  variant?: "ghost" | "footer";
}

export function ContactDialog({ variant = "ghost" }: ContactDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "footer" ? (
          <button className="hover:text-foreground transition-colors">
            Contact
          </button>
        ) : (
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Contact Support">
            <Mail className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-header-bg" />
            <DialogTitle>Contact Support</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Have a question, issue, or feedback? Reach out and we'll get back to you as soon as we can.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <a
            href="mailto:support@practicedaily.app"
            className="inline-flex items-center gap-2 text-sm font-medium text-header-bg hover:underline"
          >
            <Mail className="h-4 w-4" />
            support@practicedaily.app
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
