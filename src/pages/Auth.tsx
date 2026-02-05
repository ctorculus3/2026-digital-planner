import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Music2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, session, subscription, subscriptionDebug, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const debugEnabled = searchParams.get("debug") === "1";
  const sessionEmail = useMemo(() => {
    const maybeEmail = (user as any)?.email ?? session?.user?.email;
    return typeof maybeEmail === "string" ? maybeEmail : null;
  }, [session?.user?.email, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;

        // Important for iPad/Safari: don't hard-navigate immediately.
        // Let the auth state listener + PublicRoute redirect take over once the
        // session is fully persisted.
        toast({
          title: "Signed in",
          description: "Opening your journal…",
        });
        return;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Music2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Music Practice Daily Record Journal</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to access your practice logs" : "Create an account to start tracking"}
          </CardDescription>
        </CardHeader>

        {debugEnabled && (
          <CardContent className="pt-0">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
              <div className="font-medium">Diagnostics (debug=1)</div>
              <div className="mt-2 grid gap-1">
                <div>route: /auth</div>
                <div>user: {user ? "present" : "null"}</div>
                <div>session: {session ? "present" : "null"}</div>
                <div>email: {sessionEmail ?? "(none)"}</div>
                <div>initialCheckDone: {String(subscription.initialCheckDone)}</div>
                <div>subscribed: {String(subscription.subscribed)}</div>
                <div>trialing: {String(subscription.isTrialing)}</div>
                <div>last check: {subscriptionDebug.lastCheckedAt ?? "(never)"}</div>
                <div>last http: {subscriptionDebug.lastHttpStatus ?? "(unknown)"}</div>
                <div>last error: {subscriptionDebug.lastErrorMessage ?? "(none)"}</div>
              </div>
            </div>
          </CardContent>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
