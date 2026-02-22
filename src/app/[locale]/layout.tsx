import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata } from "next";
import type { Viewport } from "next";

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
    themeColor: "#0f172a",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const isRo = locale === "ro";
    const title = isRo
        ? "GetSign.app | Semnătură Electronică Simplă & Rapidă"
        : "GetSign.app | Effortless E-Signatures & Document Signing";
    const description = isRo
        ? "Cea mai simplă metodă de a semna documente PDF online. Încarcă, adaugă semnatari și finalizează documentele în câteva secunde."
        : "The simplest way to sign and send documents online. Upload any PDF, add signers, and track signatures in real-time.";
    const baseUrl = "https://getsign.app";
    const canonicalUrl = locale === "en" ? baseUrl : `${baseUrl}/${locale}`;

    return {
        metadataBase: new URL(baseUrl),
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
            languages: {
                en: `${baseUrl}/en`,
                ro: `${baseUrl}/ro`,
            },
        },
        icons: {
            icon: [
                { url: "/favicon.ico", sizes: "any" },
                { url: "/favicon.svg", type: "image/svg+xml" },
                { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
            ],
            apple: [
                { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
            ],
        },
        openGraph: {
            type: "website",
            locale: isRo ? "ro_RO" : "en_US",
            url: canonicalUrl,
            siteName: "GetSign",
            title,
            description,
            images: [
                {
                    url: "/og-image.png",
                    width: 1200,
                    height: 630,
                    alt: "GetSign – Effortless E-Signatures & Document Signing",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/og-image.png"],
        },
    };
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }
    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <NextIntlClientProvider messages={messages}>
                <TooltipProvider>
                    {children}
                </TooltipProvider>
                <Toaster />
            </NextIntlClientProvider>
        </ThemeProvider>
    );
}
