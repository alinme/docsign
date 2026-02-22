"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/logo/Logo";
import { AuthFooter } from "@/components/auth/AuthFooter";

const buttonTransition = "transition-all duration-200 ease-out";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState<boolean | null>(null);
    const t = useTranslations("Auth");
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        const check = () => supabase.auth.getSession().then(({ data: { session } }) => !!session);
        check().then(setReady);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check().then(setReady));
        const timeout = setTimeout(() => check().then((ok) => setReady((r) => (r === null && !ok ? false : r))), 2500);
        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (error) {
            toast.error(t("updatePasswordError"));
            return;
        }
        toast.success(t("passwordUpdated"));
        router.push("/");
    }

    if (ready === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading…</p>
                </div>
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
                    <div className="w-full max-w-[400px] space-y-6 text-center">
                        <div className="mx-auto mb-4 flex justify-center">
                            <Logo className="h-12 w-12" />
                        </div>
                        <h2 className="text-xl font-bold">{t("updatePasswordTitle")}</h2>
                        <p className="text-sm text-muted-foreground">{t("updatePasswordError")}</p>
                        <Button asChild className={`w-full ${buttonTransition}`}>
                            <Link href="/auth/login">{t("backToLogin")}</Link>
                        </Button>
                    </div>
                </div>
                <AuthFooter />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-[400px] space-y-6">
                    <div className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex justify-center">
                            <Logo className="h-12 w-12" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {t("updatePasswordTitle")}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t("updatePasswordDesc")}
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">{t("newPassword")}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">{t("confirmPassword")}</Label>
                            <Input
                                id="confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                            />
                        </div>
                        <Button
                            type="submit"
                            className={`w-full ${buttonTransition}`}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                            {t("updatePassword")}
                        </Button>
                    </form>
                </div>
            </div>
            <AuthFooter />
        </div>
    );
}
