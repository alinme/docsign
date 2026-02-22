"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { login, signup } from "@/actions/auth";
import { Loader2, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoginView, setIsLoginView] = useState(true);
    const t = useTranslations("Auth");

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);

        const action = isLoginView ? login : signup;
        const result = await action(formData);

        // Server actions redirect on success, so we only handle errors here.
        if (result?.error) {
            toast.error(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
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
                    <CardContent>
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
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                />
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
    );
}
