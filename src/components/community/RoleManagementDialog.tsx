import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, UserMinus, UserPlus, Loader2 } from "lucide-react";

interface Moderator {
  user_id: string;
  display_name: string | null;
}

interface SearchResult {
  id: string;
  display_name: string | null;
  is_moderator: boolean;
}

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleManagementDialog({ open, onOpenChange }: RoleManagementDialogProps) {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loadingMods, setLoadingMods] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchModerators = useCallback(async () => {
    setLoadingMods(true);
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "moderator");

    if (rolesError) {
      console.error("Error fetching moderators:", rolesError);
      setLoadingMods(false);
      return;
    }

    if (!roles || roles.length === 0) {
      setModerators([]);
      setLoadingMods(false);
      return;
    }

    const userIds = roles.map((r) => r.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoadingMods(false);
      return;
    }

    const mods: Moderator[] = userIds.map((uid) => {
      const profile = profiles?.find((p) => p.id === uid);
      return { user_id: uid, display_name: profile?.display_name ?? null };
    });

    setModerators(mods);
    setLoadingMods(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchModerators();
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open, fetchModerators]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setSearching(true);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .ilike("display_name", `%${debouncedSearch.trim()}%`)
        .limit(10);

      if (error) {
        console.error("Error searching profiles:", error);
        setSearching(false);
        return;
      }

      const modIds = new Set(moderators.map((m) => m.user_id));
      const results: SearchResult[] = (profiles || []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        is_moderator: modIds.has(p.id),
      }));

      setSearchResults(results);
      setSearching(false);
    };

    search();
  }, [debouncedSearch, moderators]);

  const handlePromote = async (userId: string, displayName: string | null) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "moderator" });

    if (error) {
      console.error("Error promoting user:", error);
      toast({
        title: "Error",
        description: "Failed to promote user. They may already be a moderator.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Promoted",
        description: `${displayName || "User"} is now a moderator.`,
      });
      await fetchModerators();
      // Update search results to reflect the change
      setSearchResults((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, is_moderator: true } : r))
      );
    }
    setActionLoading(null);
  };

  const handleDemote = async (userId: string, displayName: string | null) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "moderator");

    if (error) {
      console.error("Error demoting user:", error);
      toast({
        title: "Error",
        description: "Failed to remove moderator role.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Demoted",
        description: `${displayName || "User"} is no longer a moderator.`,
      });
      await fetchModerators();
      setSearchResults((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, is_moderator: false } : r))
      );
    }
    setActionLoading(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Manage Moderators
          </DialogTitle>
          <DialogDescription>
            Promote or demote community members to the moderator role.
          </DialogDescription>
        </DialogHeader>

        {/* Current Moderators */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Current Moderators
          </h3>
          {loadingMods ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : moderators.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No moderators assigned yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {moderators.map((mod) => (
                <li
                  key={mod.user_id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm truncate">
                    {mod.display_name || "Unnamed user"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDemote(mod.user_id, mod.display_name)}
                    disabled={actionLoading === mod.user_id}
                  >
                    {actionLoading === mod.user_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserMinus className="h-3 w-3" />
                    )}
                    <span className="ml-1">Remove</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search & Promote */}
        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-sm font-semibold text-foreground">
            Add Moderator
          </h3>
          <Input
            placeholder="Search by display name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!searching && searchResults.length > 0 && (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm truncate">
                    {result.display_name || "Unnamed user"}
                  </span>
                  {result.is_moderator ? (
                    <span className="text-xs text-muted-foreground">
                      Already mod
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handlePromote(result.id, result.display_name)
                      }
                      disabled={actionLoading === result.id}
                    >
                      {actionLoading === result.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      <span className="ml-1">Promote</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!searching &&
            debouncedSearch.trim().length >= 2 &&
            searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No users found.
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
