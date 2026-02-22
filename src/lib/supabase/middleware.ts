import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const segments = pathname.split('/').filter(Boolean)
    const localeSegment = segments[0]
    const isLocale = localeSegment === 'en' || localeSegment === 'ro'
    const locale = isLocale ? localeSegment : 'en'
    const pathWithoutLocale = isLocale ? '/' + segments.slice(1).join('/') : pathname

    if (
        !user &&
        !pathWithoutLocale.startsWith('/auth/login') &&
        !pathWithoutLocale.startsWith('/auth/callback') &&
        !pathWithoutLocale.startsWith('/auth/forgot-password') &&
        !pathWithoutLocale.startsWith('/auth/update-password') &&
        !pathWithoutLocale.startsWith('/sign/')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}/auth/login`
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
