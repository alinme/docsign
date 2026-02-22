"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

async function getLocale(): Promise<string> {
    const h = await headers();
    const locale = h.get("x-next-intl-locale");
    return hasLocale(routing.locales, locale) ? locale! : routing.defaultLocale;
}

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        return { error: error.message };
    }

    const locale = await getLocale();
    revalidatePath("/", "layout");
    redirect(`/${locale}`);
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signUp(data);

    if (error) {
        return { error: error.message };
    }

    const locale = await getLocale();
    revalidatePath("/", "layout");
    redirect(`/${locale}`);
}

export async function logout(formData?: FormData) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
    }

    const locale = await getLocale();
    revalidatePath("/", "layout");
    redirect(`/${locale}/auth/login`);
}
