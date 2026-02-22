"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { login, signup } from "@/actions/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/logo/Logo";

const SOCIAL_LOGIN_COOKIE = "getsign_social_login_enabled";

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
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

function MetaIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

const buttonTransition = "transition-all duration-200 ease-out";

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoginView, setIsLoginView] = useState(true);
    const [socialLoginEnabled, setSocialLoginEnabled] = useState(true);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingMeta, setLoadingMeta] = useState(false);
    const params = useParams();
    const locale = (params?.locale as string) || "en";
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

    const redirectToCallback = typeof window !== "undefined" ? `${window.location.origin}/${locale}/auth/callback` : "";
    const anySocialLoading = loadingGoogle || loadingMeta;

    async function handleSignInWith(provider: "google" | "facebook") {
        if (provider === "google") setLoadingGoogle(true);
        else setLoadingMeta(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: redirectToCallback },
        });
        if (error) {
            toast.error(t("socialSignInError"));
            if (provider === "google") setLoadingGoogle(false);
            else setLoadingMeta(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            <div className="flex w-full flex-col shrink-0 lg:w-[480px] lg:min-h-screen lg:border-r lg:border-border lg:sticky lg:top-0">
                <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                    <div className="w-full max-w-[400px]">
                        <Card className="shadow-lg border-border">
                            <CardHeader className="space-y-1 text-center">
                                <div className="mx-auto mb-4 flex justify-center">
                                    <Logo className="h-12 w-12" />
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
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={`w-full ${buttonTransition} hover:scale-[1.02] active:scale-[0.98]`}
                                                onClick={() => handleSignInWith("google")}
                                                disabled={anySocialLoading}
                                            >
                                                {loadingGoogle ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                                                ) : (
                                                    <GoogleIcon className="mr-2 h-4 w-4 shrink-0" />
                                                )}
                                                <span>{isLoginView ? t("signInWithGoogle") : t("signUpWithGoogle")}</span>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={`w-full bg-[#1877F2] hover:bg-[#166FE5] hover:scale-[1.02] active:scale-[0.98] text-white border-[#1877F2] ${buttonTransition}`}
                                                onClick={() => handleSignInWith("facebook")}
                                                disabled={anySocialLoading}
                                            >
                                                {loadingMeta ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                                                ) : (
                                                    <MetaIcon className="mr-2 h-4 w-4 shrink-0" />
                                                )}
                                                <span>{isLoginView ? t("signInWithFacebook") : t("signUpWithFacebook")}</span>
                                            </Button>
                                        </div>
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
                                                <Link href="/auth/forgot-password" className="text-xs font-normal text-primary hover:underline">
                                                    {t("forgotPassword")}
                                                </Link>
                                            )}
                                        </div>
                                        <Input id="password" name="password" type="password" required />
                                    </div>
                                    <Button
                                        className={`w-full ${buttonTransition} hover:scale-[1.01] active:scale-[0.99]`}
                                        type="submit"
                                        disabled={isLoading || anySocialLoading}
                                    >
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                                        <span className="truncate">{isLoginView ? t("signIn") : t("register")}</span>
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <div className="text-sm text-muted-foreground text-center w-full">
                                    {isLoginView ? t("noAccount") : t("hasAccount")}
                                </div>
                                <Button
                                    variant="outline"
                                    className={`w-full ${buttonTransition} hover:scale-[1.01] active:scale-[0.99]`}
                                    onClick={() => setIsLoginView(!isLoginView)}
                                    disabled={isLoading || anySocialLoading}
                                    type="button"
                                >
                                    {isLoginView ? t("createAccount") : t("signInInstead")}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col min-h-0 overflow-y-auto w-full lg:min-h-screen">
                <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 xl:px-16">
                    <div className="max-w-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Logo className="h-10 w-10 sm:h-12 sm:w-12" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl xl:text-4xl">
                                GetSign
                            </h1>
                        </div>
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
