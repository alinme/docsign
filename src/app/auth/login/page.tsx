"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { login, signup } from "@/actions/auth";
import { Loader2, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const SOCIAL_LOGIN_COOKIE = "docsign_social_login_enabled";

function getSocialLoginEnabled(): boolean {
    if (typeof document === "undefined") return true;
    const match = document.cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${SOCIAL_LOGIN_COOKIE}=`));
    if (!match) return true;
    return match.split("=")[1]?.toLowerCase() !== "false";
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoginView, setIsLoginView] = useState(true);
    const [socialLoginEnabled, setSocialLoginEnabled] = useState(true);
    const [socialLoading, setSocialLoading] = useState(false);
    const t = useTranslations("Auth");
    const tLanding = useTranslations("Landing");

    useEffect(() => {
        setSocialLoginEnabled(getSocialLoginEnabled());
    }, []);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        const action = isLoginView ? login : signup;
        const result = await action(formData);
        if (result?.error) {
            toast.error(result.error);
            setIsLoading(false);
        }
    }

    async function handleSignInWithGoogle() {
        setSocialLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
            },
        });
        if (error) {
            toast.error(t("socialSignInError"));
            setSocialLoading(false);
        }
        // Otherwise browser redirects
    }

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            {/* Fixed sign-in/sign-up panel */}
            <div className="flex w-full flex-col shrink-0 lg:w-[480px] lg:min-h-screen lg:border-r lg:border-border lg:sticky lg:top-0">
                <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                    <div className="w-full max-w-[400px]">
                        <Card className="shadow-lg border-border">
                            <CardHeader className="space-y-1 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                                    <Fingerprint className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight">
                                    {isLoginView ? t("welcomeBack") : t("createAccount")}
                                </CardTitle>
                                <CardDescription>
                                    {isLoginView ? t("signInDesc") : t("signUpDesc")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {socialLoginEnabled && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleSignInWithGoogle}
                                            disabled={socialLoading}
                                        >
                                            {socialLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <GoogleIcon className="mr-2 h-4 w-4" />
                                            )}
                                            {t("signInWithGoogle")}
                                        </Button>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-border" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                                                <span className="bg-card px-2">{t("orContinueWith")}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <form action={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t("email")}</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder={t("emailPlaceholder")}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">{t("password")}</Label>
                                            {isLoginView && (
                                                <Button variant="link" className="px-0 font-normal h-auto text-xs" type="button">
                                                    {t("forgotPassword")}
                                                </Button>
                                            )}
                                        </div>
                                        <Input id="password" name="password" type="password" required />
                                    </div>
                                    <Button className="w-full" type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isLoginView ? t("signIn") : t("signUp")}
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <div className="text-sm text-muted-foreground text-center w-full">
                                    {isLoginView ? t("noAccount") : t("hasAccount")}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setIsLoginView(!isLoginView)}
                                    disabled={isLoading}
                                    type="button"
                                >
                                    {isLoginView ? t("createAccount") : t("signInInstead")}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Scrollable landing half */}
            <div className="flex flex-1 flex-col min-h-0 overflow-y-auto w-full lg:min-h-screen">
                <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 xl:px-16">
                    <div className="max-w-lg">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl xl:text-4xl">
                            DocSign
                        </h1>
                        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                            {tLanding("tagline")}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                            {tLanding("heroDescription")}
                        </p>
                    </div>
                </div>
                <footer className="border-t border-border px-4 py-4 sm:px-6 lg:px-8 xl:px-16">
                    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:gap-x-6 sm:text-sm">
                        <Link href="/about" className="hover:text-foreground transition-colors">
                            {tLanding("footerAbout")}
                        </Link>
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            {tLanding("footerPrivacy")}
                        </Link>
                        <Link href="/cookies" className="hover:text-foreground transition-colors">
                            {tLanding("footerCookies")}
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            {tLanding("footerTerms")}
                        </Link>
                        <Link href="/docs" className="hover:text-foreground transition-colors">
                            {tLanding("footerDocumentation")}
                        </Link>
                    </nav>
                </footer>
            </div>
        </div>
    );
}
