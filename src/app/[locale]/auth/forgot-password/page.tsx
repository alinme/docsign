"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/logo/Logo";

const buttonTransition = "transition-all duration-200 ease-out";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const params = useParams();
    const locale = (params?.locale as string) || "en";
    const t = useTranslations("Auth");

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/${locale}/auth/update-password` : "";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo,
        });
        setLoading(false);
        if (error) {
            toast.error(t("forgotPasswordError"));
            return;
        }
        setSent(true);
        toast.success(t("resetLinkSent"));
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <Card className="w-full max-w-[400px] shadow-lg border-border">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex justify-center">
                        <Logo className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {t("forgotPasswordTitle")}
                    </CardTitle>
                    <CardDescription>
                        {t("forgotPasswordDesc")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sent ? (
                        <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                            {t("resetLinkSent")}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t("email")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t("emailPlaceholder")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className={`w-full ${buttonTransition}`}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                                {t("sendResetLink")}
                            </Button>
                        </form>
                    )}
                    <Button
                        variant="ghost"
                        className={`w-full gap-2 ${buttonTransition}`}
                        asChild
                    >
                        <Link href="/auth/login">
                            <ArrowLeft className="h-4 w-4" />
                            {t("backToLogin")}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
