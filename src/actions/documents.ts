"use server";

import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { revalidatePath } from "next/cache";
import { DEFAULT_SIGNATURE_COLOR } from "@/lib/signature";

function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN;
    if (domain) return `https://${domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
    return "http://localhost:3000";
}

/** Base URL used in email links. Set EMAIL_BASE_URL=http://localhost:3000 in .env.local for local testing so links point to localhost. */
function getEmailBaseUrl(): string {
    if (process.env.EMAIL_BASE_URL) return process.env.EMAIL_BASE_URL.replace(/\/$/, "");
    return getBaseUrl();
}

const BASE_URL = getBaseUrl();
const DOWNLOAD_LINK_EXPIRY_DAYS = 7;
const DOWNLOAD_LINK_EXPIRY_SECONDS = DOWNLOAD_LINK_EXPIRY_DAYS * 24 * 60 * 60;

/** Get client IP from request headers (server). */
async function getClientIpFromHeaders(): Promise<string | null> {
    try {
        const h = await headers();
        const forwarded = h.get("x-forwarded-for");
        if (forwarded) return forwarded.split(",")[0].trim();
        return h.get("x-real-ip") ?? null;
    } catch {
        return null;
    }
}

/** Insert audit log with optional details and IP. */
async function auditLog(
    documentId: string,
    action: string,
    actorEmail: string,
    opts: { ip_address?: string | null; user_agent?: string | null; details?: Record<string, unknown> | null } = {}
) {
    await supabase.from("audit_logs").insert({
        document_id: documentId,
        action,
        actor_email: actorEmail,
        ip_address: opts.ip_address ?? null,
        user_agent: opts.user_agent ?? null,
        details: opts.details ?? null,
    });
}

const resendUrl = process.env.RESEND_API_KEY!;
const resend = new Resend(resendUrl);

const RESEND_TEST_FROM = "GetSign <onboarding@resend.dev>";

function isResendTestMode(): boolean {
    return process.env.NODE_ENV !== "production";
}

/** Sender for Resend. RESEND_FROM overrides. Else RESEND_FROM_NAME + RESEND_FROM_EMAIL, or default from domain. */
function getResendFrom(): string {
    if (process.env.RESEND_FROM) return process.env.RESEND_FROM;
    const name = process.env.RESEND_FROM_NAME || "GetSign";
    const email = process.env.RESEND_FROM_EMAIL;
    if (email) return `${name} <${email}>`;
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN?.replace(/^https?:\/\//, "") || "getsign.app";
    return isResendTestMode() ? RESEND_TEST_FROM : `${name} <noreply@${domain}>`;
}

/** When using Resend's test domain, only RESEND_EMAIL can receive. Redirect "to" in test mode. */
function getResendTo(intendedRecipient: string): string {
    if (!isResendTestMode()) return intendedRecipient;
    const devInbox = process.env.RESEND_EMAIL;
    if (devInbox) return devInbox;
    console.warn("RESEND_EMAIL is not set; test-domain emails may fail. Set RESEND_EMAIL in .env.local.");
    return intendedRecipient;
}

export async function searchDocuments(query: string) {
    if (!query) return { data: [] };
    try {
        const supabaseServer = await createClient();
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) throw new Error("Unauthorized");
        const initiatorEmail = user.email;

        const { data: documents, error } = await supabase
            .from("documents")
            .select("id, file_name, status, signer_name, signer_email")
            .eq("initiator_email", initiatorEmail)
            .or(`file_name.ilike.%${query}%,signer_name.ilike.%${query}%,signer_email.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) throw error;
        return { data: documents };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getRecentDocuments() {
    try {
        const supabaseServer = await createClient();
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) throw new Error("Unauthorized");
        const initiatorEmail = user.email;

        const { data: documents, error } = await supabase
            .from("documents")
            .select("*")
            .eq("initiator_email", initiatorEmail)
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) throw error;

        return { data: documents };
    } catch (error: any) {
        console.error("Error fetching documents:", error);
        return { error: error.message };
    }
}

export async function uploadDocument(formData: FormData) {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const file = formData.get("file") as File | null;
    const templateId = formData.get("templateId") as string | null;
    const signersRaw = formData.get("signers") as string;
    const signCoordinatesRaw = formData.get("signCoordinates") as string | null;
    const expirationDaysRaw = formData.get("expirationDays") as string;
    const expirationDays = parseInt(expirationDaysRaw, 10) || 7;

    const initiatorEmail = user.email as string;
    const initiatorName = user.user_metadata?.full_name || initiatorEmail;
    const initiatorCompany = user.user_metadata?.is_business ? user.user_metadata?.company_name : null;
    const initiatorCompanyInfo = user.user_metadata?.is_business ? user.user_metadata?.company_info : null;

    if ((!file && !templateId) || !signersRaw) {
        return { error: "Missing required fields" };
    }

    let signers: any[] = [];
    try {
        signers = JSON.parse(signersRaw).map((s: any) => ({
            ...s,
            status: 'Pending',
            signedAt: null
        }));
    } catch (e) {
        return { error: "Invalid signers data." };
    }

    let signCoordinates = null;
    let finalFileName = "";
    let finalFileOriginalName = "";

    try {
        if (templateId) {
            const { data: templateData, error: templateError } = await supabaseServer
                .from("templates")
                .select("*")
                .eq("id", templateId)
                .single();

            if (templateError || !templateData) {
                throw new Error("Template not found.");
            }

            signCoordinates = signCoordinatesRaw
                ? (() => { try { return JSON.parse(signCoordinatesRaw); } catch { return templateData.sign_coordinates; } })()
                : templateData.sign_coordinates;
            finalFileName = `doc_${Date.now()}_from_template_${templateId}.pdf`;
            finalFileOriginalName = templateData.template_name;

            const { error: copyError } = await supabaseServer.storage
                .from("documents")
                .copy(templateData.storage_path, finalFileName);

            if (copyError) {
                console.error("Template Copy Error:", copyError);
                throw new Error("Failed to instantiate from template storage.");
            }

        } else if (file) {
            if (signCoordinatesRaw) {
                try { signCoordinates = JSON.parse(signCoordinatesRaw); } catch (e) { }
            }

            finalFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
            finalFileOriginalName = file.name;

            const { data: storageData, error: storageError } = await supabase.storage
                .from("documents")
                .upload(finalFileName, file);

            if (storageError) throw storageError;

        } else {
            return { error: "Either a file or a template is required." };
        }

        // 2. Create DB Record (owner's signature color from profile so all signers use it)
        const ownerSignatureColor = (user.user_metadata?.signature_color as string) || DEFAULT_SIGNATURE_COLOR;
        const { data: docData, error: docError } = await supabase
            .from("documents")
            .insert({
                file_name: finalFileOriginalName,
                storage_path: finalFileName,
                status: "Pending",
                expires_at: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
                initiator_email: initiatorEmail,
                initiator_name: initiatorName,
                initiator_company: initiatorCompany,
                initiator_company_info: initiatorCompanyInfo,
                signers: signers,
                signer_name: signers[0]?.name || '', // Legacy fallback
                signer_email: signers[0]?.email || '', // Legacy fallback
                signer_company: signers[0]?.isBusiness ? signers[0]?.company ?? null : null,
                signer_company_info: signers[0]?.isBusiness ? signers[0]?.companyInfo ?? null : null,
                sign_coordinates: signCoordinates,
                signature_color: ownerSignatureColor
            })
            .select()
            .single();

        if (docError) throw docError;

        const clientIp = await getClientIpFromHeaders();
        await auditLog(docData.id, "DOCUMENT_CREATED", initiatorEmail, { ip_address: clientIp, details: { signer_count: signers.length, file_name: finalFileOriginalName } });

        // 4. Send Email via Resend: each signer gets their own link; copy to host (no duplicate if host is signer)
        const signerEmails = new Set(signers.map((s: any) => s.email.toLowerCase()));
        const hostIsSigner = signerEmails.has(initiatorEmail.toLowerCase());

        if (resendUrl) {
            await Promise.all(signers.map((signer: any) =>
                resend.emails.send({
                    from: getResendFrom(),
                    to: getResendTo(signer.email),
                    subject: `${initiatorName} requested your signature`,
                    html: `<p>Hello ${signer.name},</p><p>${initiatorName} has requested your signature on the document &quot;${finalFileOriginalName}&quot;.</p><p><a href="${getEmailBaseUrl()}/sign/${docData.id}?signer=${signer.id}">Click here to sign</a></p>`,
                })
            ));
            signers.forEach((signer: any) => {
                auditLog(docData.id, "EMAIL_SENT", initiatorEmail, { details: { to: signer.email, event: "signing_request" } }).catch(() => {});
            });

            if (!hostIsSigner && initiatorEmail) {
                const signerList = signers.map((s: any) => `${s.name || "Signer"} (${s.email})`).join(", ");
                resend.emails.send({
                    from: getResendFrom(),
                    to: getResendTo(initiatorEmail),
                    subject: `Copy: You sent "${finalFileOriginalName}" for signature`,
                    html: `<p>Hi ${initiatorName},</p><p>You sent the document &quot;${finalFileOriginalName}&quot; to: ${signerList}.</p><p>They will receive their signing links by email.</p><p><a href="${getEmailBaseUrl()}/documents">View in GetSign</a></p>`,
                }).catch((e) => console.warn("Resend copy-to-host failed:", e));
                auditLog(docData.id, "EMAIL_SENT", initiatorEmail, { details: { to: initiatorEmail, event: "copy_to_host" } }).catch(() => {});
            }
        } else {
            console.warn("Resend API key missing, skipped sending email.");
        }

        return { success: true, documentId: docData.id };
    } catch (err: any) {
        console.error("Upload error:", err);
        return { error: err.message || "Failed to upload document" };
    }
}

export async function getDocumentById(id: string) {
    try {
        const { data: document, error } = await supabase
            .from("documents")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;

        // Also generate a temporary signed URL for the PDF
        const { data: urlData, error: storageError } = await supabase.storage
            .from("documents")
            .createSignedUrl(document.storage_path, 3600); // 1 hour expiry

        // Provide graceful fallback for missing storage files instead of throwing entire page 404
        if (storageError) {
            console.warn("Could not generate signed URL for document file. It may have been deleted.", storageError);
        }

        return { data: { ...document, signedUrl: urlData?.signedUrl || null } };
    } catch (error: any) {
        console.error("Error fetching document:", error);
        return { error: error?.message || JSON.stringify(error) || "Unknown Error fetching document" };
    }
}

export async function finalizeSignature(
    documentId: string,
    signerId: string,
    signatureBase64: string,
    fieldsData: Record<string, string | boolean> = {},
    opts?: { clientIp?: string | null; userAgent?: string | null }
) {
    try {
        // 1. Fetch document record
        const { data: document, error: fetchError } = await supabase
            .from("documents")
            .select("*")
            .eq("id", documentId)
            .single();

        if (fetchError || !document) throw new Error("Document not found");

        const signers = document.signers || [];
        const effectiveSignerId = signerId || (signers.length === 1 ? signers[0]?.id : null) || "";
        const currentSigner = signers.find((s: any) => s.id === effectiveSignerId);
        if (!currentSigner && signers.length > 0) throw new Error("Signer not found");
        const currentSignerName = currentSigner ? currentSigner.name : document.signer_name;
        const currentSignerEmail = currentSigner ? currentSigner.email : document.signer_email;

        // 2. Download original PDF from Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("documents")
            .download(document.storage_path);

        if (downloadError || !fileData) throw new Error("Failed to download PDF");

        // 3. Load PDF into pdf-lib
        const pdfBytes = await fileData.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // 4. Process Signature Image (optional depending on blocks)
        let signatureImage = null;
        let signatureDims = { width: 140, height: 45 };

        if (signatureBase64) {
            let imageBytes: Uint8Array;
            if (signatureBase64.startsWith("http://") || signatureBase64.startsWith("https://")) {
                const res = await fetch(signatureBase64);
                if (!res.ok) throw new Error("Failed to fetch signature image");
                const ab = await res.arrayBuffer();
                imageBytes = new Uint8Array(ab);
            } else {
                const base64Data = signatureBase64.replace(/^data:image\/[a-z]+;base64,/, "");
                imageBytes = new Uint8Array(Buffer.from(base64Data, "base64"));
            }
            signatureImage = await pdfDoc.embedPng(imageBytes);
            signatureDims = signatureImage.scale(0.25);
        }

        // 5. Draw signature and advanced UI fields on the specific mapped page and coordinates
        const pages = pdfDoc.getPages();
        const { width, height } = pages[0].getSize(); // For fallback defaults

        let coordinatesArray = Array.isArray(document.sign_coordinates)
            ? document.sign_coordinates
            : document.sign_coordinates ? [document.sign_coordinates] : [];

        coordinatesArray = coordinatesArray.filter((c: any) => c.signerId === effectiveSignerId || !c.signerId);

        if (coordinatesArray.length === 0) {
            // Default to last page bottom right if no coordinates found
            coordinatesArray.push({ pageNum: pages.length, type: 'signature' });
        }

        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Map and burn the signature matrix across all coordinates
        for (const coords of coordinatesArray) {
            let targetPageNum = coords.pageNum || pages.length;
            targetPageNum = Math.min(Math.max(1, targetPageNum), pages.length);
            const targetPage = pages[targetPageNum - 1];
            const pageDims = targetPage.getSize();

            let xPos = width - signatureDims.width - 50;
            let yPos = 50;

            if (coords.xPct !== undefined && coords.yPct !== undefined) {
                // Precise mapping using relative percentages
                xPos = coords.xPct * pageDims.width;

                // PDF origin is bottom-left. DOM origin was top-left.
                const yFromTop = coords.yPct * pageDims.height;
                yPos = pageDims.height - yFromTop - signatureDims.height;
            } else if (coords.x !== undefined && coords.y !== undefined) {
                // Legacy/fallback fallback mapping
                xPos = Math.max(0, Math.min(coords.x, pageDims.width - signatureDims.width));
                const domY = coords.y;
                yPos = Math.max(0, pageDims.height - domY - signatureDims.height);
            }

            // Final boundary checks to keep blocks within the active canvas securely bounding inputs
            xPos = Math.max(0, Math.min(xPos, pageDims.width - signatureDims.width));
            yPos = Math.max(0, Math.min(yPos, pageDims.height - signatureDims.height));

            const fieldType = coords.type || 'signature';

            if (fieldType === 'signature') {
                if (signatureImage) {
                    targetPage.drawImage(signatureImage, {
                        x: xPos,
                        y: yPos,
                        width: signatureDims.width,
                        height: signatureDims.height,
                    });
                }

                // Add the signer's name text directly under the signature to legally burn it onto the PDF
                let currentYOffset = yPos - 14;

                targetPage.drawText(`Signed by: ${currentSignerName}`, {
                    x: xPos,
                    y: currentYOffset,
                    size: 10,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });

                const signerCompany = currentSigner.company ?? document.signer_company;
                const signerCompanyInfo = currentSigner.companyInfo ?? document.signer_company_info;
                if (signerCompany) {
                    currentYOffset -= 12;
                    targetPage.drawText(`${signerCompany}`, {
                        x: xPos,
                        y: currentYOffset,
                        size: 9,
                        font: helveticaFont,
                        color: rgb(0.3, 0.3, 0.3),
                    });
                }

                if (signerCompanyInfo) {
                    currentYOffset -= 12;
                    targetPage.drawText(`${signerCompanyInfo}`, {
                        x: xPos,
                        y: currentYOffset,
                        size: 8,
                        font: helveticaFont,
                        color: rgb(0.5, 0.5, 0.5),
                    });
                }
            } else if (fieldType === 'text') {
                const textValue = (fieldsData[coords.id] as string) || '';
                targetPage.drawText(textValue, {
                    x: xPos + 10,
                    y: yPos + 15, // Align nicely inside the block
                    size: 12,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            } else if (fieldType === 'date') {
                const dateValue = (fieldsData[coords.id] as string) || new Date().toLocaleDateString();
                targetPage.drawText(dateValue, {
                    x: xPos + 10,
                    y: yPos + 15,
                    size: 12,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            } else if (fieldType === 'checkbox') {
                const isChecked = !!fieldsData[coords.id];
                if (isChecked) {
                    // Draw a strong 'X' intersecting the boolean block 
                    targetPage.drawText('X', {
                        x: xPos + 8,
                        y: yPos + 8,
                        size: 16,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                    });
                }
            }
        }

        // 6. Save and Upload the finalized PDF
        const finalizedPdfBytes = await pdfDoc.save();
        const finalizedPath = document.storage_path.startsWith('signed_')
            ? document.storage_path
            : `signed_${document.storage_path}`;

        const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(finalizedPath, finalizedPdfBytes, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) throw new Error("Failed to upload finalized PDF");

        // 7. Update database record
        let allCompleted = true;
        const updatedSigners = signers.map((s: any) => {
            if (s.id === effectiveSignerId) {
                return { ...s, status: 'Signed', signedAt: new Date().toISOString() };
            }
            if (s.status !== 'Signed') {
                allCompleted = false;
            }
            return s;
        });

        const newStatus = allCompleted ? "Completed" : "Pending";

        const { error: updateError } = await supabase
            .from("documents")
            .update({
                status: newStatus,
                signers: updatedSigners,
                storage_path: finalizedPath // Point to the new signed file
            })
            .eq("id", documentId);

        if (updateError) throw updateError;

        const initiatorEmail = document.initiator_email;
        const initiatorName = document.initiator_name || "Document owner";
        const docName = document.file_name || "your document";

        // 8. Log audit trail with visitor IP
        await auditLog(documentId, "DOCUMENT_SIGNED", currentSignerEmail, {
            ip_address: opts?.clientIp ?? null,
            user_agent: opts?.userAgent ?? null,
            details: { signer_name: currentSignerName, signer_id: effectiveSignerId },
        });

        // 9. Notify initiator (copy to host) and other signers — skip "signer signed" when the signer is the owner; owner only gets "document fully signed" with download
        if (resendUrl) {
            const otherSigners = signers.filter((s: any) => s.id !== effectiveSignerId);
            const signerIsOwner = (currentSignerEmail || "").toLowerCase() === (initiatorEmail || "").toLowerCase();

            if (initiatorEmail && !signerIsOwner) {
                resend.emails.send({
                    from: getResendFrom(),
                    to: getResendTo(initiatorEmail),
                    subject: `${currentSignerName} signed: ${docName}`,
                    html: `<p>Hi ${initiatorName},</p><p><strong>${currentSignerName}</strong> has signed the document &quot;${docName}&quot;.</p><p><a href="${getEmailBaseUrl()}/documents">View in GetSign</a></p>`,
                }).catch((e) => console.warn("Resend notify initiator failed:", e));
                auditLog(documentId, "EMAIL_SENT", initiatorEmail, { details: { to: initiatorEmail, event: "signer_signed_notify_host" } }).catch(() => {});
            }

            for (const s of otherSigners) {
                if (s.email && s.email.toLowerCase() !== (initiatorEmail || "").toLowerCase()) {
                    resend.emails.send({
                        from: getResendFrom(),
                        to: getResendTo(s.email),
                        subject: `${currentSignerName} signed — what are you waiting for?`,
                        html: `<p>Hello ${s.name || "there"},</p><p><strong>${currentSignerName}</strong> has signed the document &quot;${docName}&quot;.</p><p><a href="${getEmailBaseUrl()}/sign/${documentId}?signer=${s.id}">Click here to sign</a></p>`,
                    }).catch((e) => console.warn("Resend nudge failed:", e));
                    auditLog(documentId, "EMAIL_SENT", initiatorEmail, { details: { to: s.email, event: "nudge_other_signer" } }).catch(() => {});
                }
            }

            // 10. When all signed: send download link to all signers + host (dedupe), link expires in 7 days
            if (allCompleted) {
                const supabaseServer = await createClient();
                const { data: urlData } = await supabaseServer.storage
                    .from("documents")
                    .createSignedUrl(finalizedPath, DOWNLOAD_LINK_EXPIRY_SECONDS);
                const downloadUrl = urlData?.signedUrl || `${getEmailBaseUrl()}/document/${documentId}`;

                await auditLog(documentId, "DOCUMENT_COMPLETED", currentSignerEmail, { details: { all_signed: true } });

                const seen = new Set<string>();
                const recipients: { email: string; name: string }[] = [];
                for (const s of signers) {
                    if (s.email && !seen.has(s.email.toLowerCase())) {
                        seen.add(s.email.toLowerCase());
                        recipients.push({ email: s.email, name: s.name || "Signer" });
                    }
                }
                if (initiatorEmail && !seen.has(initiatorEmail.toLowerCase())) {
                    recipients.push({ email: initiatorEmail, name: initiatorName });
                }

                const expiryText = `${DOWNLOAD_LINK_EXPIRY_DAYS} days`;
                for (const r of recipients) {
                    resend.emails.send({
                        from: getResendFrom(),
                        to: getResendTo(r.email),
                        subject: `Document fully signed: ${docName}`,
                        html: `<p>Hi ${r.name},</p><p>The document &quot;${docName}&quot; is fully signed.</p><p><a href="${downloadUrl}">Download your copy here</a></p><p>This link expires in ${expiryText}.</p>`,
                    }).catch((e) => console.warn("Resend download link failed:", e));
                    auditLog(documentId, "EMAIL_SENT", initiatorEmail, { details: { to: r.email, event: "download_link", expires_in: expiryText } }).catch(() => {});
                }
            }
        }

        revalidatePath("/");
        revalidatePath(`/sign/${documentId}`);

        return { success: true };
    } catch (err: any) {
        console.error("Signature error:", err);
        return { error: err.message || "Failed to finalize signature" };
    }
}

export async function getAuditLogs(documentId: string) {
    try {
        const supabaseServer = await createClient();
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const { data: logs, error } = await supabase
            .from("audit_logs")
            .select("*")
            .eq("document_id", documentId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        return { data: logs };
    } catch (error: any) {
        console.error("Error fetching audit logs:", error);
        return { error: error.message };
    }
}

export async function deleteDocument(documentId: string) {
    try {
        const supabaseServer = await createClient();
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const { data: doc, error: fetchError } = await supabaseServer
            .from("documents")
            .select("storage_path, initiator_email")
            .eq("id", documentId)
            .single();

        if (fetchError || !doc) throw new Error("Document not found");
        if (doc.initiator_email !== user.email) throw new Error("Unauthorized");

        const pathsToRemove = [doc.storage_path];
        if (doc.storage_path.startsWith("signed_")) {
            pathsToRemove.push(doc.storage_path.replace(/^signed_/, ""));
        }
        const { error: storageError } = await supabaseServer.storage
            .from("documents")
            .remove(pathsToRemove);
        if (storageError) console.warn("Storage deletion warning (one or both paths may be missing):", storageError);

        const { error: dbError } = await supabaseServer
            .from("documents")
            .delete()
            .eq("id", documentId);

        if (dbError) throw dbError;

        revalidatePath("/");
        revalidatePath("/documents");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting document:", error);
        return { error: error.message };
    }
}

export async function emailDocumentSigners(documentId: string) {
    try {
        const supabaseServer = await createClient();
        const { data: { user } } = await supabaseServer.auth.getUser();
        if (!user) return { error: "Unauthorized" };

        const { data: document, error: fetchError } = await supabaseServer
            .from("documents")
            .select("id, file_name, initiator_name, initiator_email, signers")
            .eq("id", documentId)
            .single();

        if (fetchError || !document) return { error: "Document not found" };
        if (document.initiator_email !== user.email) return { error: "Unauthorized" };

        const signers = document.signers || [];
        const initiatorName = document.initiator_name || document.initiator_email || "Someone";
        const baseUrl = getEmailBaseUrl();

        if (!resendUrl) return { error: "Email is not configured." };
        await Promise.all(signers.map((signer: any) =>
            resend.emails.send({
                from: getResendFrom(),
                to: getResendTo(signer.email),
                subject: `${initiatorName} requested your signature`,
                html: `<p>Hello ${signer.name || "there"},</p><p>${initiatorName} has requested your signature on the document &quot;${document.file_name}&quot;.</p><p><a href="${baseUrl}/sign/${document.id}?signer=${signer.id}">Click here to sign</a></p>`,
            })
        ));
        for (const signer of signers) {
            await auditLog(documentId, "EMAIL_SENT", user.email!, { details: { to: signer.email, event: "manual_email_signers" } });
        }
        revalidatePath("/");
        revalidatePath("/documents");
        return { success: true };
    } catch (err: any) {
        console.error("Email signers error:", err);
        return { error: err?.message || "Failed to send emails" };
    }
}
