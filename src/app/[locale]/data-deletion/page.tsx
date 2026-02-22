import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
                    <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">User data deletion</h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US")}</p>
                <div className="mt-8 space-y-6 text-sm text-muted-foreground">
                    <section>
                        <h2 className="text-base font-semibold text-foreground">How to delete your data</h2>
                        <p className="mt-2">
                            If you signed up with email and password: sign in to GetSign, go to <strong>Settings</strong> (or your account/profile), and use the option to delete your account. This will remove your account and associated data from our systems.
                        </p>
                        <p className="mt-2">
                            If you signed up with Google or Meta (Facebook): sign in to GetSign, then go to <strong>Settings</strong> and delete your account. You may also revoke GetSign&apos;s access from your Google or Meta account settings.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">What we delete</h2>
                        <p className="mt-2">
                            When you request account deletion, we delete your profile, stored documents and templates linked to your account, and other personal data we hold. Some data may be retained where required by law (e.g. audit logs) for a limited period.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">Third-party logins (e.g. Facebook/Meta)</h2>
                        <p className="mt-2">
                            If you used &quot;Sign in with Meta&quot; (or another provider), deleting your GetSign account removes your data from our service. To remove GetSign from your Meta (or other) account, use that provider&apos;s app and account settings.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">Contact</h2>
                        <p className="mt-2">
                            For deletion requests or questions, contact us at the email address provided on getsign.app.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
