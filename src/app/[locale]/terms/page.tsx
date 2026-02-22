import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
                    <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
                <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US")}</p>
                <div className="mt-8 space-y-6 text-sm text-muted-foreground">
                    <section>
                        <h2 className="text-base font-semibold text-foreground">1. Acceptance</h2>
                        <p className="mt-2">
                            By using GetSign you agree to these Terms of Service. If you do not agree, do not use the service.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">2. Description of service</h2>
                        <p className="mt-2">
                            GetSign provides online document signing and related features. We reserve the right to modify or discontinue the service with reasonable notice where possible.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">3. Acceptable use</h2>
                        <p className="mt-2">
                            You must use the service lawfully and not for illegal, fraudulent, or harmful purposes. You are responsible for the content you upload and the accuracy of signer information.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">4. Account & data</h2>
                        <p className="mt-2">
                            You are responsible for keeping your account secure. Your use of the service is also governed by our Privacy Policy. You may request deletion of your data as described there.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">5. Limitation of liability</h2>
                        <p className="mt-2">
                            The service is provided &quot;as is.&quot; To the extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the service.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">6. Contact</h2>
                        <p className="mt-2">
                            For questions about these terms, contact us at the email or contact details provided on getsign.app.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
