import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, User, Moon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ThemeToggle";

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your DocSign workspace preferences.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Moon className="h-5 w-5 text-muted-foreground" />
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize the interface theme of your workspace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between pt-0">
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <strong>Platform Theme</strong>
                            <span>Switch between light and dark modes natively.</span>
                        </div>
                        <ModeToggle />
                    </CardContent>
                </Card>

                {/* Account Settings Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-muted-foreground" />
                            Account Profile
                        </CardTitle>
                        <CardDescription>
                            Manage your personal profile and authentication methods.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-full">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Google Authentication</p>
                                    <p className="text-xs text-muted-foreground">You are securely connected with Google.</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" disabled>Manage</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Workspace Settings */}
                <Card className="border-dashed border-2 shadow-none bg-muted/50 mt-4">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-background p-4 mb-4">
                            <Wrench className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Workspace Settings Coming Soon</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            In a future update, you will be able to customize your branding, notification preferences, and team members here!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
