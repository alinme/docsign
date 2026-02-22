"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { User, Loader2, PenTool, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import SignatureCanvas from "react-signature-canvas";
import { saveUserSignature, getUserSignature, deleteUserSignature } from "@/actions/signatures";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
    const supabase = createClient();
    const t = useTranslations("Profile");
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const sigPad = useRef<SignatureCanvas>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({ fullName: "", email: "", isBusiness: false, companyName: "", companyInfo: "" });
    const [signatureColor, setSignatureColor] = useState<string | null>(null);
    const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);
    const penColor = signatureColor ?? (resolvedTheme === "dark" ? "white" : "black");
    const [signatureLoading, setSignatureLoading] = useState(true);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [isSavingSignature, setIsSavingSignature] = useState(false);
    const [isDeletingSignature, setIsDeletingSignature] = useState(false);

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setProfile({
                    email: user.email || "",
                    fullName: user.user_metadata?.full_name || "",
                    isBusiness: !!user.user_metadata?.is_business,
                    companyName: user.user_metadata?.company_name || "",
                    companyInfo: user.user_metadata?.company_info || "",
                });
                if (user.user_metadata?.signature_color) {
                    setSignatureColor(user.user_metadata.signature_color as string);
                }
            }
            setIsLoading(false);
        }
        loadProfile();
    }, []);

    useEffect(() => {
        async function fetchSignature() {
            const result = await getUserSignature();
            if (result?.data) setSavedSignatureUrl(result.data);
            setSignatureLoading(false);
        }
        fetchSignature();
    }, []);

    const handleSaveSignature = async () => {
        if (sigPad.current?.isEmpty()) {
            toast.error(t("provideSignatureWarning"));
            return;
        }
        setIsSavingSignature(true);
        try {
            const dataURL = sigPad.current?.getTrimmedCanvas().toDataURL("image/png");
            if (dataURL) {
                const result = await saveUserSignature(dataURL);
                if (result.error) throw new Error(result.error);
                toast.success(t("signatureSaved"));
                const refreshResult = await getUserSignature();
                if (refreshResult?.data) setSavedSignatureUrl(refreshResult.data);
                setSignatureModalOpen(false);
            }
        } catch {
            toast.error(t("failedToSaveSignature"));
        } finally {
            setIsSavingSignature(false);
        }
    };

    const handleDeleteSignature = async () => {
        setIsDeletingSignature(true);
        try {
            const result = await deleteUserSignature();
            if (result.error) throw new Error(result.error);
            setSavedSignatureUrl(null);
            toast.success(t("signatureDeleted"));
        } catch {
            toast.error(t("failedToDeleteSignature"));
        } finally {
            setIsDeletingSignature(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: profile.fullName,
                    is_business: profile.isBusiness,
                    company_name: profile.isBusiness ? profile.companyName : null,
                    company_info: profile.isBusiness ? profile.companyInfo : null
                }
            });

            if (error) throw error;

            toast.success(t("profileUpdated"));
            router.refresh(); // Refresh layout to update navbar avatar
        } catch (error: any) {
            toast.error(error.message || t("failedToUpdateProfile"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("myProfile")}</h1>
                    <p className="text-muted-foreground mt-1">{t("myProfileDesc")}</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            {t("personalInfo")}
                        </CardTitle>
                        <CardDescription>
                            {t("personalInfoDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("emailAddress")}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="bg-muted text-muted-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground">{t("emailManagedProvider")}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fullName">{t("fullName")}</Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder={t("fullNamePlaceholder")}
                                        value={profile.fullName}
                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">{t("fullNameDesc")}</p>
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isBusiness"
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                                        checked={profile.isBusiness}
                                        onChange={(e) => setProfile({ ...profile, isBusiness: e.target.checked })}
                                    />
                                    <Label htmlFor="isBusiness" className="cursor-pointer">{t("isBusinessAccount")}</Label>
                                </div>

                                {profile.isBusiness && (
                                    <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">{t("businessName")}</Label>
                                            <Input
                                                id="companyName"
                                                type="text"
                                                placeholder={t("businessNamePlaceholder")}
                                                value={profile.companyName}
                                                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="companyInfo">{t("additionalBusinessInfo")}</Label>
                                            <textarea
                                                id="companyInfo"
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder={t("additionalBusinessInfoPlaceholder")}
                                                value={profile.companyInfo}
                                                onChange={(e) => setProfile({ ...profile, companyInfo: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" disabled={isSaving || !profile.fullName.trim()}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("saveChanges")}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* My signature */}
                <Card>
                    <CardContent className="pt-6 flex flex-row gap-8 items-stretch min-h-[200px]">
                        <div className="flex-1 flex flex-col gap-4 min-w-0">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <PenTool className="h-5 w-5 text-muted-foreground" />
                                    {t("mySignature")}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {t("mySignatureDesc")}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSignatureModalOpen(true)}
                                >
                                    {savedSignatureUrl ? t("changeSignature") : t("addSignature")}
                                </Button>
                                {savedSignatureUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={handleDeleteSignature}
                                        disabled={isDeletingSignature}
                                    >
                                        {isDeletingSignature ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        {t("delete")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="w-64 shrink-0 flex flex-col items-center justify-center rounded-xl border bg-muted/30 p-4">
                            {signatureLoading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            ) : savedSignatureUrl ? (
                                <img
                                    src={savedSignatureUrl}
                                    alt="Your saved signature"
                                    className="max-h-24 w-full object-contain dark:invert"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground text-center">{t("noSignatureYet")}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Signature canvas modal */}
                <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
                    <DialogContent className="sm:max-w-2xl border-border">
                        <DialogHeader>
                            <DialogTitle>{t("drawYourSignature")}</DialogTitle>
                            <DialogDescription>
                                {t("drawBelow")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden">
                            <SignatureCanvas
                                ref={sigPad}
                                penColor={penColor}
                                canvasProps={{ className: "w-full min-h-[280px]" }}
                            />
                        </div>
                        <DialogFooter className="flex flex-wrap gap-3 sm:justify-end pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => sigPad.current?.clear()}
                                disabled={isSavingSignature}
                            >
                                {t("clear")}
                            </Button>
                            <Button type="button" onClick={handleSaveSignature} disabled={isSavingSignature}>
                                {isSavingSignature ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PenTool className="h-4 w-4 mr-2" />}
                                {t("saveSignatureBtn")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Account */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                            {t("account")}
                        </CardTitle>
                        <CardDescription>
                            {t("accountDesc")}
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
            </div>
        </div>
    );
}
