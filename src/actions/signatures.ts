"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveUserSignature(signatureData: string) {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    try {
        // Remove the Base64 data:image prefix to get the raw string
        const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const fileName = `${user.id}/signature.png`;

        const { data, error } = await supabaseServer.storage
            .from("signatures")
            .upload(fileName, buffer, {
                contentType: "image/png",
                upsert: true, // Overwrite existing signature if they re-save
            });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error saving signature:", error);
        return { error: "Failed to save signature" };
    }
}

export async function getUserSignature() {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) return { data: null };

    const fileName = `${user.id}/signature.png`;

    try {
        // First, check if the object actually exists before trying to sign it
        const { data: listData, error: listError } = await supabaseServer.storage
            .from("signatures")
            .list(user.id);

        if (listError || !listData || listData.length === 0) {
            return { data: null };
        }

        const signatureExists = listData.find(file => file.name === 'signature.png');
        if (!signatureExists) return { data: null };

        // If it exists, create a temporary (1hr) signed URL
        const { data: urlData, error: urlError } = await supabaseServer.storage
            .from("signatures")
            .createSignedUrl(fileName, 3600);

        if (urlError) throw urlError;

        return { data: urlData.signedUrl };
    } catch (error) {
        console.error("Error fetching signature:", error);
        return { data: null };
    }
}

export async function deleteUserSignature() {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const fileName = `${user.id}/signature.png`;

    try {
        const { error } = await supabaseServer.storage
            .from("signatures")
            .remove([fileName]);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting signature:", error);
        return { error: "Failed to delete signature" };
    }
}
