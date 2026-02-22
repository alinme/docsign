import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getLocaleFromPath(pathname: string): string {
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];
    return first === "en" || first === "ro" ? first : "en";
}

export async function GET(request: Request) {
    const { searchParams, pathname, origin } = new URL(request.url);
    const code = searchParams.get("code");
    let next = searchParams.get("next") ?? "/";
    if (!next.startsWith("/")) next = "/";
    const locale = getLocaleFromPath(pathname);
    const pathWithLocale = next === "/" ? `/${locale}` : `/${locale}${next}`;

    if (code) {
        const cookieStore = await cookies();
        const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookies) {
                        cookies.forEach((c) => cookiesToSet.push({ name: c.name, value: c.value, options: c.options }));
                        try {
                            cookies.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                        } catch {
                            // ignore
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";
            const base = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin);
            const url = `${base}${pathWithLocale}`;
            const res = NextResponse.redirect(url, { status: 302 });
            cookiesToSet.forEach(({ name, value, options }) => {
                res.cookies.set(name, value, options as Record<string, unknown>);
            });
            return res;
        }
    }

    return NextResponse.redirect(`${origin}/${locale}/auth/login`, { status: 302 });
}
