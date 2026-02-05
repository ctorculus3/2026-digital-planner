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
 
     // Check for authorization (cron job should pass the anon key)
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       throw new Error("No authorization header provided");
     }
     logStep("Authorization verified");
 
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
 
     if (!dryRun && usersToDelete.length > 0) {
       // Delete practice logs for all marked users
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