import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
                    <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US")}</p>
                <div className="mt-8 space-y-6 text-sm text-muted-foreground">
                    <section>
                        <h2 className="text-base font-semibold text-foreground">1. Information we collect</h2>
                        <p className="mt-2">
                            We collect information you provide when signing up (email, name), when you create or sign documents (signer details, document metadata), and technical data (IP address, device info) for security and audit purposes.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">2. How we use it</h2>
                        <p className="mt-2">
                            We use your data to operate the service (sending documents, signatures, emails), to improve the product, and to comply with legal obligations. We do not sell your personal data.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">3. Data retention & deletion</h2>
                        <p className="mt-2">
                            We retain your account and document data while your account is active. You may request deletion of your data at any time (see our Data deletion page). Audit logs may be kept for a limited period for legal and security reasons.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">4. GDPR (EU/EEA users)</h2>
                        <p className="mt-2">
                            If you are in the European Union or EEA, you have the right to access, rectify, erase, restrict processing, and port your data, and to object to processing. You may also lodge a complaint with a supervisory authority. To exercise these rights, contact us or use the Data deletion page.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">5. Contact</h2>
                        <p className="mt-2">
                            For privacy-related questions, contact us at the email address provided in the app or on getsign.app.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
