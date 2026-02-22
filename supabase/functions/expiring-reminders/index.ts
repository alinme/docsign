// Supabase Edge Function: send reminder emails to pending signers for documents expiring in 48 hours.
// Invoke with: Authorization: Bearer <ANON_KEY> (Supabase requires a valid JWT) and X-Cron-Secret: <CRON_SECRET>.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API = "https://api.resend.com/emails";

function getResendFrom(): string {
    const from = Deno.env.get("RESEND_FROM");
    if (from) return from;
    const name = Deno.env.get("RESEND_FROM_NAME") ?? "GetSign";
    const email = Deno.env.get("RESEND_FROM_EMAIL");
    if (email) return `${name} <${email}>`;
    return "GetSign <onboarding@resend.dev>";
}

function getAppUrl(): string {
    return (Deno.env.get("APP_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://getsign.app").replace(/\/$/, "");
}

Deno.serve(async (req) => {
    try {
        const cronSecret = Deno.env.get("CRON_SECRET")?.trim();
        const rawHeader = req.headers.get("X-Cron-Secret") ?? "";
        const headerSecret = rawHeader.replace(/^["']|["']$/g, "").trim();
        if (cronSecret && headerSecret !== cronSecret) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const resendApiKey = Deno.env.get("RESEND_API_KEY");

        if (!resendApiKey) {
            return new Response(
                JSON.stringify({ error: "RESEND_API_KEY not set", documentsProcessed: 0, emailsSent: 0 }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const { data: documents, error: fetchError } = await supabase
            .from("documents")
            .select("id, file_name, initiator_name, initiator_email, signers")
            .eq("status", "Pending")
            .gt("expires_at", now.toISOString())
            .lte("expires_at", in48h.toISOString());

        if (fetchError) {
            return new Response(
                JSON.stringify({ error: fetchError.message, documentsProcessed: 0, emailsSent: 0 }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const docs = documents ?? [];
        const appUrl = getAppUrl();
        const from = getResendFrom();
        let emailsSent = 0;

        for (const doc of docs) {
            const signers = (doc.signers as { id: string; name?: string; email: string }[]) ?? [];
            const initiatorName = doc.initiator_name || doc.initiator_email || "Someone";

            for (const signer of signers) {
                if (!signer?.email) continue;
                const subject = `Reminder: "${doc.file_name}" expires soon – signature requested`;
                const signUrl = `${appUrl}/en/sign/${doc.id}?signer=${signer.id}`;
                const html = `<p>Hello ${signer.name || "there"},</p><p>This is a reminder that <strong>${initiatorName}</strong> requested your signature on the document &quot;${doc.file_name}&quot;.</p><p>It expires in the next 48 hours.</p><p><a href="${signUrl}">Click here to sign</a></p>`;

                const res = await fetch(RESEND_API, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${resendApiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from,
                        to: [signer.email],
                        subject,
                        html,
                    }),
                });

                if (res.ok) {
                    emailsSent += 1;
                    await supabase.from("audit_logs").insert({
                        document_id: doc.id,
                        action: "EMAIL_SENT",
                        actor_email: "system@getsign.app",
                        details: { to: signer.email, event: "expiring_reminder" },
                    });
                }
            }
        }

        return new Response(
            JSON.stringify({
                documentsProcessed: docs.length,
                emailsSent,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error",
                documentsProcessed: 0,
                emailsSent: 0,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
