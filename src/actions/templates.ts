"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveTemplate(formData: FormData) {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const file = formData.get("file") as File;
    const templateName = formData.get("templateName") as string;
    const signCoordinatesRaw = formData.get("signCoordinates") as string;
    const creatorEmail = user.email as string;

    if (!file || !templateName || !signCoordinatesRaw) {
        return { error: "Missing required fields" };
    }

    let signCoordinates = null;
    try {
        signCoordinates = JSON.parse(signCoordinatesRaw);
    } catch (e) {
        return { error: "Invalid signature coordinates format." };
    }

    try {
        // 1. Upload Base PDF to Storage
        const fileName = `template_${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { data: storageData, error: storageError } = await supabaseServer.storage
            .from("documents")
            .upload(fileName, file);

        if (storageError) throw storageError;

        // 2. Create DB Record in `templates` table
        const { error: dbError } = await supabaseServer
            .from("templates")
            .insert({
                template_name: templateName,
                storage_path: fileName,
                creator_email: creatorEmail,
                sign_coordinates: signCoordinates
            });

        if (dbError) throw dbError;

        revalidatePath("/templates");
        return { success: true };

    } catch (error: any) {
        console.error("Template Save Error:", error);
        return { error: error.message || "An unexpected error occurred." };
    }
}

export async function getTemplates() {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    try {
        // Fetch all templates for the logged in user
        const { data, error } = await supabaseServer
            .from("templates")
            .select("*")
            .eq("creator_email", user.email)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return { data };
    } catch (error: any) {
        console.error("Fetch Templates Error:", error);
        return { error: error.message || "Failed to fetch templates." };
    }
}

export async function getTemplateById(templateId: string) {
    const supabaseServer = await createClient();

    try {
        const { data, error } = await supabaseServer
            .from("templates")
            .select("*")
            .eq("id", templateId)
            .single();

        if (error || !data) throw error || new Error("Template not found");

        const { data: urlData, error: storageError } = await supabaseServer.storage
            .from("documents")
            .createSignedUrl(data.storage_path, 3600); // 1 hour expiry

        if (storageError) {
            console.warn("Could not generate signed URL for template file.", storageError);
        }

        return { data: { ...data, signedUrl: urlData?.signedUrl || null } };
    } catch (error: any) {
        console.error("Fetch Template Error:", error);
        return { error: error.message || "Failed to fetch template details." };
    }
}

export async function deleteTemplate(templateId: string) {
    try {
        const supabaseServer = await createClient();
        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const { data: template, error: fetchError } = await supabaseServer
            .from("templates")
            .select("storage_path, creator_email")
            .eq("id", templateId)
            .single();

        if (fetchError || !template) throw new Error("Template not found");
        if (template.creator_email !== user.email) throw new Error("Unauthorized");

        const { error: storageError } = await supabaseServer.storage
            .from("documents")
            .remove([template.storage_path]);

        if (storageError) console.error("Storage deletion error", storageError);

        const { error: dbError } = await supabaseServer
            .from("templates")
            .delete()
            .eq("id", templateId);

        if (dbError) throw dbError;

        revalidatePath("/templates");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting template:", error);
        return { error: error.message };
    }
}
