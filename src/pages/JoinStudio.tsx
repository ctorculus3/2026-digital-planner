import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinStudio() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studioName, setStudioName] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    // Look up the studio name
    supabase
      .from("teacher_studios")
      .select("studio_name")
      .eq("invite_code", code.toUpperCase())
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStudioName(data.studio_name);
        } else {
          setError("Invalid invite code");
        }
        setLookingUp(false);
      });
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;
    setJoining(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("join_studio_by_code", {
        p_invite_code: code,
      });
      if (rpcError) throw rpcError;
      const result = data as any;
      if (result?.error) throw new Error(result.error);
      setJoined(true);
      toast({ title: `Joined ${result.studio_name}!` });
    } catch (err: any) {
      setError(err.message);
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || lookingUp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Join a Studio</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>You need to sign in first to join <strong>{studioName || "this studio"}</strong>.</p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={() => navigate(`/auth?redirect=/join/${code}`)}>
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle>{joined ? "You're In!" : "Join Studio"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {error && !joined ? (
            <p className="text-destructive">{error}</p>
          ) : joined ? (
            <div className="space-y-3">
              <CheckCircle className="h-10 w-10 mx-auto text-primary" />
              <p className="text-foreground">
                You've joined <strong>{studioName}</strong>. Your teacher can now see your practice logs.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              You've been invited to join <strong>{studioName}</strong>. Your teacher will be able to view your practice logs.
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-center gap-2">
          {joined ? (
            <Button onClick={() => navigate("/journal")}>Go to Journal</Button>
          ) : !error ? (
            <>
              <Button variant="outline" onClick={() => navigate("/journal")}>
                Cancel
              </Button>
              <Button onClick={handleJoin} disabled={joining}>
                {joining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Join Studio
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/journal")}>Go to Journal</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
