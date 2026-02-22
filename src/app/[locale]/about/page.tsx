import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
                    <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">About GetSign</h1>
                <div className="mt-8 space-y-6 text-sm text-muted-foreground">
                    <p>
                        GetSign is a simple, secure way to sign and send documents online. Upload PDFs, add signers, and track signatures in one place.
                    </p>
                    <p>
                        We focus on ease of use and reliability so you can get documents signed without hassle. For more details, see our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                    </p>
                    <p>
                        For support or feedback, contact us at the email address provided on getsign.app.
                    </p>
                </div>
            </div>
        </div>
    );
}
