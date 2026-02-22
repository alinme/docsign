"use client";

import { useState, useEffect } from "react";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, User, Moon, CheckCircle2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const SIGNATURE_COLORS = [
    { hex: "#0f172a", label: "Slate" },
    { hex: "#1e293b", label: "Slate mid" },
    { hex: "#334155", label: "Slate light" },
    { hex: "#1e3a5f", label: "Navy" },
    { hex: "#1d4ed8", label: "Blue" },
    { hex: "#2563eb", label: "Blue light" },
    { hex: "#7f1d1d", label: "Red dark" },
    { hex: "#991b1b", label: "Red" },
    { hex: "#b91c1c", label: "Red light" },
    { hex: "#9a3412", label: "Orange dark" },
    { hex: "#c2410c", label: "Orange" },
    { hex: "#171717", label: "Neutral" },
] as const;

export default function SettingsPage() {
    const supabase = createClient();
    const t = useTranslations("Settings");
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.signature_color) {
                setSelectedColor(user.user_metadata.signature_color);
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleSelectColor = async (hex: string) => {
        setSelectedColor(hex);
        const { error } = await supabase.auth.updateUser({ data: { signature_color: hex } });
        if (error) {
            toast.error(t("failedToSaveColor"));
            setSelectedColor(selectedColor);
        } else {
            toast.success(t("signatureColorSaved"));
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground mt-1">{t("description")}</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Moon className="h-5 w-5 text-muted-foreground" />
                            {t("appearance")}
                        </CardTitle>
                        <CardDescription>
                            {t("appearanceDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between pt-0">
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <strong>{t("platformTheme")}</strong>
                            <span>{t("platformThemeDesc")}</span>
                        </div>
                        <ModeToggle />
                    </CardContent>
                </Card>

                {/* Signature color */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-muted-foreground" />
                            {t("signatureColor")}
                        </CardTitle>
                        <CardDescription>
                            {t("signatureColorDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {loading ? (
                            <div className="h-12 w-full rounded-md bg-muted/50 animate-pulse" />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {SIGNATURE_COLORS.map(({ hex }) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() => handleSelectColor(hex)}
                                        className={`w-10 h-10 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selectedColor === hex ? "border-primary ring-2 ring-primary/20 scale-110" : "border-border hover:border-muted-foreground/50"}`}
                                        style={{ backgroundColor: hex }}
                                        title={hex}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Account Settings Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            {t("accountProfile")}
                        </CardTitle>
                        <CardDescription>
                            {t("accountProfileDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-full">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{t("googleAuth")}</p>
                                    <p className="text-xs text-muted-foreground">{t("googleAuthDesc")}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" disabled>{t("manage")}</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Workspace Settings */}
                <Card className="border-dashed border-2 shadow-none bg-muted/50 mt-4">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-background p-4 mb-4">
                            <Wrench className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">{t("workspaceComingSoon")}</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {t("workspaceComingSoonDesc")}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
