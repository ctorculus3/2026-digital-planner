import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SubscriberEventPayload {
  event: "signup" | "update" | "cancel";
  email: string;
  name?: string;
  trial_start?: string;
  trial_end?: string;
  marketing_opt_in?: boolean;
}

/**
 * Fire-and-forget helper that sends subscriber lifecycle events
 * to the notify-subscriber-event edge function.
 * Catches all errors silently so it never blocks the caller.
 */
export async function notifySubscriberEvent(
  session: Session | null,
  payload: SubscriberEventPayload
): Promise<void> {
  if (!session) return;
  try {
    await supabase.functions.invoke("notify-subscriber-event", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: payload,
    });
  } catch (err) {
    console.warn("[notifySubscriberEvent] failed:", err);
  }
}
