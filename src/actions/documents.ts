"use server";

import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { revalidatePath } from "next/cache";

const resendUrl = process.env.RESEND_API_KEY!;
const resend = new Resend(resendUrl);

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
    const signerIsBusiness = formData.get("signerIsBusiness") === "true";
    const signerCompany = formData.get("signerCompany") as string;
    const signerCompanyInfo = formData.get("signerCompanyInfo") as string;
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

            signCoordinates = templateData.sign_coordinates;
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

        // 2. Create DB Record
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
                signer_company: signerIsBusiness ? signerCompany : null,
                signer_company_info: signerIsBusiness ? signerCompanyInfo : null,
                sign_coordinates: signCoordinates
            })
            .select()
            .single();

        if (docError) throw docError;

        // 3. Create Audit Log
        await supabase.from("audit_logs").insert({
            document_id: docData.id,
            action: "DOCUMENT_CREATED",
            actor_email: initiatorEmail,
        });

        // 4. Send Email via Resend
        if (resendUrl) {
            await Promise.all(signers.map(signer =>
                resend.emails.send({
                    from: "DocSign <noreply@docsign.app>",
                    to: signer.email,
                    subject: `${initiatorName} requested your signature`,
                    html: `<p>Hello ${signer.name},</p><p>${initiatorName} (${initiatorEmail}) has requested your signature on a document.</p><p><a href="http://localhost:3000/sign/${docData.id}?signer=${signer.id}">Click here to sign it</a></p>`,
                })
            ));
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

export async function finalizeSignature(documentId: string, signerId: string, signatureBase64: string, fieldsData: Record<string, string | boolean> = {}) {
    try {
        // 1. Fetch document record
        const { data: document, error: fetchError } = await supabase
            .from("documents")
            .select("*")
            .eq("id", documentId)
            .single();

        if (fetchError || !document) throw new Error("Document not found");

        const signers = document.signers || [];
        const currentSigner = signers.find((s: any) => s.id === signerId);
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
            const base64Data = signatureBase64.replace(/^data:image\/[a-z]+;base64,/, "");
            const imageBytes = Buffer.from(base64Data, 'base64');
            signatureImage = await pdfDoc.embedPng(imageBytes);
            signatureDims = signatureImage.scale(0.25);
        }

        // 5. Draw signature and advanced UI fields on the specific mapped page and coordinates
        const pages = pdfDoc.getPages();
        const { width, height } = pages[0].getSize(); // For fallback defaults

        let coordinatesArray = Array.isArray(document.sign_coordinates)
            ? document.sign_coordinates
            : document.sign_coordinates ? [document.sign_coordinates] : [];

        coordinatesArray = coordinatesArray.filter((c: any) => c.signerId === signerId || !c.signerId);

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

                if (document.signer_company) {
                    currentYOffset -= 12;
                    targetPage.drawText(`${document.signer_company}`, {
                        x: xPos,
                        y: currentYOffset,
                        size: 9,
                        font: helveticaFont,
                        color: rgb(0.3, 0.3, 0.3),
                    });
                }

                if (document.signer_company_info) {
                    currentYOffset -= 12;
                    targetPage.drawText(`${document.signer_company_info}`, {
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
            if (s.id === signerId) {
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

        // 8. Log audit trail
        await supabase.from("audit_logs").insert({
            document_id: documentId,
            action: "DOCUMENT_SIGNED",
            actor_email: currentSignerEmail,
        });

        // 9. If document is complete, trigger final completion handler?
        // Future optional extension.

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

        const { error: storageError } = await supabaseServer.storage
            .from("documents")
            .remove([doc.storage_path]);

        if (storageError) console.error("Storage deletion error", storageError);

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
