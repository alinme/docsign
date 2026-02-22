import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
                    <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Cookie Policy</h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US")}</p>
                <div className="mt-8 space-y-6 text-sm text-muted-foreground">
                    <section>
                        <h2 className="text-base font-semibold text-foreground">1. What we use</h2>
                        <p className="mt-2">
                            We use cookies and similar technologies to keep you signed in, remember your preferences (e.g. language, theme), and to operate the service securely. We do not use third-party advertising cookies.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">2. Types of cookies</h2>
                        <p className="mt-2">
                            Strictly necessary cookies are required for authentication and core functionality. Preference cookies store settings such as locale or UI theme. You can control these in your browser or in-app settings where available.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">3. Your choices</h2>
                        <p className="mt-2">
                            You can disable or delete cookies in your browser. Some features may not work correctly if you disable essential cookies.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">4. More information</h2>
                        <p className="mt-2">
                            For details on how we process personal data, see our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
