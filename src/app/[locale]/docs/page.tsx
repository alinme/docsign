import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
                    <Link href="/auth/login">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Documentation</h1>
                <div className="mt-8 space-y-6 text-sm text-muted-foreground">
                    <p>
                        GetSign lets you upload PDFs, add signers by email, place signature and date fields on the document, and send signing links. Signers open the link, sign, and the completed document is available to all parties.
                    </p>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">Getting started</h2>
                        <p className="mt-2">
                            Sign up or sign in, then create a new document (upload a PDF or start from a template). Add at least one signer (name and email), place fields on the PDF, and send. Signers receive an email with a link to sign.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">Templates</h2>
                        <p className="mt-2">
                            Save a document as a template from the document page. You can then create new documents from the template and reuse the same layout and signer setup.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-base font-semibold text-foreground">Support</h2>
                        <p className="mt-2">
                            For help or feature requests, contact us at the email address provided on getsign.app.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
