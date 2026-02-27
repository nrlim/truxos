"use server";

import { createClient } from "@supabase/supabase-js";

export async function uploadExpenseAttachment(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
        return { error: "No file provided" };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return { error: "Supabase credentials are not configured in .env" };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "truxos";

    try {
        const { data, error } = await supabase.storage
            .from(bucketName) // Please ensure this bucket exists in Supabase and is public
            .upload(`expenses/${fileName}`, file, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error("Supabase Storage error:", error.message);
            return { error: error.message };
        }

        const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(`expenses/${fileName}`);

        return { url: publicData.publicUrl };
    } catch (e: any) {
        return { error: e.message || "Failed to upload file to Supabase" };
    }
}

export async function deleteExpenseAttachment(attachmentUrl: string) {
    if (!attachmentUrl) return { error: "No URL provided" };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return { error: "Supabase credentials are not configured in .env" };
    }

    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "truxos";
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const urlParts = attachmentUrl.split(bucketName + '/');
        if (urlParts.length !== 2) return { error: "Invalid attachment URL" };

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) {
            console.error("Supabase Storage error:", error.message);
            return { error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Failed to delete file from Supabase" };
    }
}
