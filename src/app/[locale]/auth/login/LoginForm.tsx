"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/actions/auth";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo/Logo";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { LandingContent } from "@/components/landing/LandingContent";

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

type View = "login" | "signup" | "forgot";

type AuthFormBodyProps = {
    view: View;
    setView: (v: View) => void;
    t: ReturnType<typeof useTranslations<"Auth">>;
    isForgotView: boolean;
    forgotSent: boolean;
    forgotEmail: string;
    setForgotEmail: (s: string) => void;
    setForgotSent: (b: boolean) => void;
    forgotLoading: boolean;
    setForgotLoading: (b: boolean) => void;
    handleForgotSubmit: (e: React.FormEvent) => void;
    isLoginView: boolean;
    socialLoginEnabled: boolean;
    anySocialLoading: boolean;
    loadingGoogle: boolean;
    loadingMeta: boolean;
    handleSignInWith: (provider: "google" | "facebook") => void;
    handleSubmit: (formData: FormData) => void;
    isLoading: boolean;
};

function AuthFormBody({
    view,
    setView,
    t,
    isForgotView,
    forgotSent,
    forgotEmail,
    setForgotEmail,
    setForgotSent,
    forgotLoading,
    setForgotLoading,
    handleForgotSubmit,
    isLoginView,
    socialLoginEnabled,
    anySocialLoading,
    loadingGoogle,
    loadingMeta,
    handleSignInWith,
    handleSubmit,
    isLoading,
}: AuthFormBodyProps) {
    return (
        <div className="w-full max-w-[400px] space-y-6">
            {isForgotView ? (
                <>
                    <div className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex justify-center">
                            <Logo className="h-12 w-12" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {t("forgotPasswordTitle")}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t("forgotPasswordDesc")}
                        </p>
                    </div>
                    <div className="space-y-4">
                        {forgotSent ? (
                            <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                                {t("resetLinkSent")}
                            </div>
                        ) : (
                            <form onSubmit={handleForgotSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="forgot-email">{t("email")}</Label>
                                    <Input
                                        id="forgot-email"
                                        type="email"
                                        placeholder={t("emailPlaceholder")}
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                        disabled={forgotLoading}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className={`w-full ${buttonTransition}`}
                                    disabled={forgotLoading}
                                >
                                    {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                                    {t("sendResetLink")}
                                </Button>
                            </form>
                        )}
                        <Button
                            variant="ghost"
                            className={`w-full gap-2 ${buttonTransition}`}
                            onClick={() => { setView("login"); setForgotSent(false); setForgotEmail(""); setForgotLoading(false); }}
                            type="button"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("backToLogin")}
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <div className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex justify-center">
                            <Logo className="h-12 w-12" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {isLoginView ? t("welcomeBack") : t("createAccount")}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {isLoginView ? t("signInDesc") : t("signUpDesc")}
                        </p>
                    </div>
                    <div className="space-y-4">
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
                                        <span className="bg-background px-2">{t("orContinueWith")}</span>
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
                                        <button
                                            type="button"
                                            className="text-xs font-normal text-primary hover:underline"
                                            onClick={() => setView("forgot")}
                                        >
                                            {t("forgotPassword")}
                                        </button>
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
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                {isLoginView ? t("noAccount") : t("hasAccount")}
                            </p>
                            <Button
                                variant="outline"
                                className={`w-full ${buttonTransition} hover:scale-[1.01] active:scale-[0.99]`}
                                onClick={() => setView(isLoginView ? "signup" : "login")}
                                disabled={isLoading || anySocialLoading}
                                type="button"
                            >
                                {isLoginView ? t("createAccount") : t("signInInstead")}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function LoginForm({ initialView }: { initialView?: View }) {
    const [view, setView] = useState<View>(initialView ?? "login");
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoginEnabled, setSocialLoginEnabled] = useState(true);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingMeta, setLoadingMeta] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSent, setForgotSent] = useState(false);
    const isLoginView = view === "login";
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const t = useTranslations("Auth");

    useEffect(() => {
        setSocialLoginEnabled(getSocialLoginEnabled());
    }, []);

    const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
    useEffect(() => {
        if (!mobileAuthOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mobileAuthOpen]);

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

    const redirectToUpdatePassword = typeof window !== "undefined" ? `${window.location.origin}/${locale}/auth/update-password` : "";
    async function handleForgotSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!forgotEmail.trim()) return;
        setForgotLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), { redirectTo: redirectToUpdatePassword });
        setForgotLoading(false);
        if (error) {
            toast.error(t("forgotPasswordError"));
            return;
        }
        setForgotSent(true);
        toast.success(t("resetLinkSent"));
    }

    const isForgotView = view === "forgot";

    const openAuth = (v: View) => {
        setView(v);
        setMobileAuthOpen(true);
    };

    const authFormBodyProps = {
        view,
        setView,
        t,
        isForgotView,
        forgotSent,
        forgotEmail,
        setForgotEmail,
        setForgotSent,
        forgotLoading,
        setForgotLoading,
        handleForgotSubmit,
        isLoginView,
        socialLoginEnabled,
        anySocialLoading,
        loadingGoogle,
        loadingMeta,
        handleSignInWith,
        handleSubmit,
        isLoading,
    };

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row lg:h-screen lg:overflow-hidden">
            {/* Mobile: semi-header with logo + app name + Log in / Create account */}
            <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 shrink-0" />
                    <span className="text-lg font-semibold tracking-tight text-foreground">GetSign</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                        {t("signIn")}
                    </Button>
                    <Button size="sm" onClick={() => openAuth("signup")}>
                        {t("createAccount")}
                    </Button>
                </div>
            </header>

            {/* Desktop: auth column (hidden on mobile) */}
            <div className="hidden w-full flex-col shrink-0 lg:flex lg:w-[480px] lg:h-screen lg:border-r lg:border-border">
                <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                    <AuthFormBody {...authFormBodyProps} />
                </div>
                <AuthFooter />
            </div>

            {/* Landing: full width on mobile, 2/3 on desktop */}
            <div className="flex flex-1 flex-col min-h-0 overflow-y-auto w-full lg:min-h-screen">
                <LandingContent onOpenAuth={openAuth} />
                <footer className="lg:hidden shrink-0 border-t border-border bg-background">
                    <AuthFooter />
                </footer>
            </div>

            {/* Mobile: slide-up auth overlay */}
            {mobileAuthOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col lg:hidden"
                    aria-modal="true"
                    role="dialog"
                >
                    <button
                        type="button"
                        aria-label="Close"
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileAuthOpen(false)}
                    />
                    <div
                        className="relative mt-auto flex max-h-[90vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <span className="text-sm font-medium text-muted-foreground">
                                {isForgotView ? t("forgotPasswordTitle") : isLoginView ? t("signIn") : t("createAccount")}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 rounded-full"
                                onClick={() => setMobileAuthOpen(false)}
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="overflow-y-auto px-4 py-6">
                            <div className="flex flex-col items-center">
                                <AuthFormBody {...authFormBodyProps} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
