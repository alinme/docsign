"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { UserCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const supabase = createClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({ fullName: "", email: "", isBusiness: false, companyName: "", companyInfo: "" });

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
            }
            setIsLoading(false);
        }
        loadProfile();
    }, []);

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

            toast.success("Profile updated successfully");
            router.refresh(); // Refresh layout to update navbar avatar
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">Manage your personal DocSign account details.</p>
                </div>
            </div>

            <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your display name to look more professional on document requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="bg-muted text-muted-foreground"
                                />
                                <p className="text-xs text-muted-foreground">Your email is managed by your authentication provider.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="e.g. Alin Moraru"
                                    value={profile.fullName}
                                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">This name will be displayed when you request signatures from clients.</p>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isBusiness"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    checked={profile.isBusiness}
                                    onChange={(e) => setProfile({ ...profile, isBusiness: e.target.checked })}
                                />
                                <Label htmlFor="isBusiness" className="cursor-pointer">This is a business account</Label>
                            </div>

                            {profile.isBusiness && (
                                <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Business Name</Label>
                                        <Input
                                            id="companyName"
                                            type="text"
                                            placeholder="e.g. Acme Corp"
                                            value={profile.companyName}
                                            onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyInfo">Additional Business Information</Label>
                                        <textarea
                                            id="companyInfo"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Address, Registration Number, VAT ID..."
                                            value={profile.companyInfo}
                                            onChange={(e) => setProfile({ ...profile, companyInfo: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <Button type="submit" disabled={isSaving || !profile.fullName.trim()}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
