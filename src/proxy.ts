import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function proxy(request: NextRequest) {
    const intlResponse = intlMiddleware(request)
    if (intlResponse && (intlResponse.status === 307 || intlResponse.status === 302)) {
        return intlResponse
    }
    return await updateSession(request)
}

export const config = {
    matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
}
