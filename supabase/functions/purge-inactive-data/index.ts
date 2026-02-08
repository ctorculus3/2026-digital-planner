 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import Stripe from "https://esm.sh/stripe@18.5.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 const INACTIVITY_DAYS = 90;
 
 const logStep = (step: string, details?: any) => {
   const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
   console.log(`[PURGE-INACTIVE-DATA] ${step}${detailsStr}`);
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     logStep("Function started");
 
      // Validate authorization - only allow calls with the service role key
      const authHeader = req.headers.get("Authorization");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
        logStep("Unauthorized access attempt blocked");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      logStep("Authorization verified (service role key)");
 
     // Parse request body for dry_run option
     let dryRun = false;
     try {
       const body = await req.json();
       dryRun = body.dry_run === true;
     } catch {
       // No body or invalid JSON, continue with defaults
     }
     logStep("Mode", { dryRun });
 
     const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
     if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
     logStep("Stripe key verified");
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
 
     // Use service role to bypass RLS
     const supabase = createClient(supabaseUrl, supabaseServiceKey, {
       auth: { persistSession: false }
     });
 
     const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
 
     // Get all unique user_ids from practice_logs
     const { data: userIds, error: userIdsError } = await supabase
       .from("practice_logs")
       .select("user_id")
       .limit(10000);
 
     if (userIdsError) {
       throw new Error(`Failed to fetch user IDs: ${userIdsError.message}`);
     }
 
     // Get unique user IDs
     const uniqueUserIds = [...new Set(userIds?.map(row => row.user_id) || [])];
     logStep("Found users with practice logs", { count: uniqueUserIds.length });
 
     const usersToDelete: string[] = [];
     const now = new Date();
     const cutoffDate = new Date(now.getTime() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
 
     for (const userId of uniqueUserIds) {
       try {
         // Get user email from auth.users using admin API
         const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
 
         if (userError || !userData?.user) {
           logStep("User not found in auth, marking for deletion", { userId });
           usersToDelete.push(userId);
           continue;
         }
 
         const userEmail = userData.user.email;
         const userCreatedAt = new Date(userData.user.created_at);
 
         if (!userEmail) {
           logStep("User has no email, skipping", { userId });
           continue;
         }
 
         // Check Stripe for this user
         const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
 
         if (customers.data.length === 0) {
           // No Stripe customer - check if account is older than 90 days
           if (userCreatedAt < cutoffDate) {
             logStep("No Stripe customer and account older than 90 days", { 
               userId, 
               email: userEmail,
               createdAt: userCreatedAt.toISOString() 
             });
             usersToDelete.push(userId);
           }
           continue;
         }
 
         const customerId = customers.data[0].id;
 
         // Get all subscriptions for this customer
         const subscriptions = await stripe.subscriptions.list({
           customer: customerId,
           limit: 100,
         });
 
         // Check if any subscription is active or trialing
         const hasActiveSubscription = subscriptions.data.some(
          (sub: { status: string }) => sub.status === "active" || sub.status === "trialing"
         );
 
         if (hasActiveSubscription) {
           logStep("User has active subscription, skipping", { userId, email: userEmail });
           continue;
         }
 
         // Find the most recent subscription end date
         let latestEndDate: Date | null = null;
         for (const sub of subscriptions.data) {
           const endDate = new Date(sub.current_period_end * 1000);
           if (!latestEndDate || endDate > latestEndDate) {
             latestEndDate = endDate;
           }
         }
 
         if (latestEndDate && latestEndDate < cutoffDate) {
           logStep("Subscription ended more than 90 days ago", { 
             userId, 
             email: userEmail,
             lastSubscriptionEnd: latestEndDate.toISOString() 
           });
           usersToDelete.push(userId);
         } else if (!latestEndDate) {
           // Has customer but no subscriptions - check account age
           if (userCreatedAt < cutoffDate) {
             logStep("Customer exists but no subscriptions, account older than 90 days", { 
               userId, 
               email: userEmail 
             });
             usersToDelete.push(userId);
           }
         }
       } catch (err) {
         logStep("Error processing user, skipping", { 
           userId, 
           error: err instanceof Error ? err.message : String(err) 
         });
       }
     }
 
      logStep("Users marked for deletion", { count: usersToDelete.length, userIds: usersToDelete });

      let deletedCount = 0;
      let deletedRecordingsCount = 0;

      if (!dryRun && usersToDelete.length > 0) {
    // First, collect all recording paths and practice log IDs before deleting
        const { data: logsToDelete, error: fetchError } = await supabase
          .from("practice_logs")
          .select("id, user_id, repertoire_recordings")
          .in("user_id", usersToDelete);

        if (fetchError) {
          logStep("Warning: Failed to fetch practice logs for recording cleanup", { error: fetchError.message });
        }

        // Collect all non-empty recording paths
        const recordingPaths: string[] = [];
        for (const log of logsToDelete || []) {
          const recordings = log.repertoire_recordings || [];
          for (const path of recordings) {
            if (path && typeof path === 'string' && path.trim()) {
              recordingPaths.push(path);
            }
          }
        }

        // Delete practice-recordings storage files
        if (recordingPaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("practice-recordings")
            .remove(recordingPaths);

          if (storageError) {
            logStep("Warning: Failed to delete some recordings", { error: storageError.message });
          } else {
            deletedRecordingsCount = recordingPaths.length;
            logStep("Deleted recordings from storage", { count: deletedRecordingsCount });
          }
        }

        // Delete practice-media storage files and database records
        const logIds = (logsToDelete || []).map(l => l.id);
        if (logIds.length > 0) {
          // Fetch media file paths
          const { data: mediaItems } = await supabase
            .from("practice_media")
            .select("file_path, media_type")
            .in("practice_log_id", logIds);

          const mediaFilePaths = (mediaItems || [])
            .filter(m => m.media_type === "audio" && m.file_path)
            .map(m => m.file_path as string);

          if (mediaFilePaths.length > 0) {
            const { error: mediaStorageError } = await supabase.storage
              .from("practice-media")
              .remove(mediaFilePaths);
            if (mediaStorageError) {
              logStep("Warning: Failed to delete some media files", { error: mediaStorageError.message });
            } else {
              logStep("Deleted media files from storage", { count: mediaFilePaths.length });
            }
          }

          // Delete practice_media rows (will also cascade when practice_logs are deleted,
          // but explicit deletion ensures storage cleanup happens first)
          const { error: mediaDeleteError } = await supabase
            .from("practice_media")
            .delete()
            .in("practice_log_id", logIds);
          if (mediaDeleteError) {
            logStep("Warning: Failed to delete media records", { error: mediaDeleteError.message });
          }

          // Delete lesson-pdfs storage files and database records
          const { data: pdfItems } = await supabase
            .from("lesson_pdfs")
            .select("file_path")
            .in("practice_log_id", logIds);

          const pdfFilePaths = (pdfItems || [])
            .filter(p => p.file_path)
            .map(p => p.file_path as string);

          if (pdfFilePaths.length > 0) {
            const { error: pdfStorageError } = await supabase.storage
              .from("lesson-pdfs")
              .remove(pdfFilePaths);
            if (pdfStorageError) {
              logStep("Warning: Failed to delete some lesson PDF files", { error: pdfStorageError.message });
            } else {
              logStep("Deleted lesson PDF files from storage", { count: pdfFilePaths.length });
            }
          }

          // Delete lesson_pdfs rows (will also cascade, but explicit for storage cleanup)
          const { error: pdfDeleteError } = await supabase
            .from("lesson_pdfs")
            .delete()
            .in("practice_log_id", logIds);
          if (pdfDeleteError) {
            logStep("Warning: Failed to delete lesson PDF records", { error: pdfDeleteError.message });
          }
        }

        // Now delete the practice logs
        const { error: deleteError, count } = await supabase
          .from("practice_logs")
          .delete()
          .in("user_id", usersToDelete);

        if (deleteError) {
          throw new Error(`Failed to delete practice logs: ${deleteError.message}`);
        }

        deletedCount = count || 0;
        logStep("Deleted practice logs", { deletedCount });
      }
 
      const result = {
        success: true,
        dry_run: dryRun,
        users_processed: uniqueUserIds.length,
        users_marked_for_deletion: usersToDelete.length,
        practice_logs_deleted: deletedCount,
        recordings_deleted: deletedRecordingsCount,
        timestamp: new Date().toISOString(),
      };
 
     logStep("Purge completed", result);
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
       status: 200,
     });
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     logStep("ERROR in purge-inactive-data", { message: errorMessage });
     return new Response(JSON.stringify({ error: errorMessage }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
       status: 500,
     });
   }
 });