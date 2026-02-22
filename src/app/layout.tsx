import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const headersList = await headers();
    const localeHeader = headersList.get("x-next-intl-locale");
    const locale = hasLocale(routing.locales, localeHeader) ? localeHeader : routing.defaultLocale;

    return (
        <html lang={locale || "en"} suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-title" content="GetSign" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "GetSign.app",
                            "operatingSystem": "Web",
                            "applicationCategory": "BusinessApplication",
                            "description": "Effortless E-Signatures & Document Signing online.",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD",
                            },
                        }),
                    }}
                />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
