import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export default async function SignaturesPage() {
    const h = await headers();
    const locale = hasLocale(routing.locales, h.get("x-next-intl-locale")) ? h.get("x-next-intl-locale")! : routing.defaultLocale;
    redirect(`/${locale}/profile`);
}
