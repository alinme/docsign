"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AuthFooter() {
    const t = useTranslations("Landing");
    return (
        <footer className="mt-auto border-t border-border px-4 py-4 sm:px-6">
            <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-muted-foreground sm:gap-x-6 ">
                <Link href="/about" className="hover:text-foreground transition-colors">
                    {t("footerAbout")}
                </Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                    {t("footerPrivacy")}
                </Link>
                <Link href="/cookies" className="hover:text-foreground transition-colors">
                    {t("footerCookies")}
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                    {t("footerTerms")}
                </Link>
                <Link href="/data-deletion" className="hover:text-foreground transition-colors">
                    {t("footerDataDeletion")}
                </Link>
                <Link href="/docs" className="hover:text-foreground transition-colors">
                    {t("footerDocumentation")}
                </Link>
            </nav>
            <p className="mt-4 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} GetSign. All rights reserved.
            </p>
        </footer>
    );
}
