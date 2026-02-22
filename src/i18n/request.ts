import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale;

    const messagesEn = (await import(`../../messages/en.json`)).default as Record<string, Record<string, string>>;
    const messagesRo = (await import(`../../messages/ro.json`)).default as Record<string, Record<string, string>>;

    const messages = locale === 'ro'
        ? mergeWithFallback(messagesRo, messagesEn)
        : messagesEn;

    return {
        locale,
        messages,
    };
});

function mergeWithFallback(
    ro: Record<string, Record<string, string>>,
    en: Record<string, Record<string, string>>
): Record<string, Record<string, string>> {
    const out: Record<string, Record<string, string>> = {};
    for (const ns of Object.keys(en)) {
        out[ns] = {};
        const enNs = en[ns] || {};
        const roNs = ro[ns] || {};
        for (const key of Object.keys(enNs)) {
            const roVal = roNs[key];
            out[ns][key] = typeof roVal === 'string' && roVal.length > 0 ? roVal : enNs[key];
        }
    }
    return out;
}
