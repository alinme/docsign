import { getDocumentById, getAuditLogs } from "@/actions/documents";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Download, ShieldCheck, Clock, User, CheckCircle2, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyLinkButton from "./copy-link-button";
import { EmailSignersButton } from "@/components/EmailSignersButton";

export default async function DocumentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const docResult = await getDocumentById(id);
    const logsResult = await getAuditLogs(id);

    if (docResult.error || !docResult.data) {
        return (
            <div className="space-y-8 pb-12">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-destructive">Document Not Found</h1>
                        <p className="text-sm text-destructive/90">Error: {docResult.error || "The document you are looking for has been deleted or does not exist."}</p>
                    </div>
                </div>
            </div>
        );
    }

    const document = docResult.data;
    const auditLogs = logsResult.data || [];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{document.file_name}</h1>
                    <p className="text-sm text-muted-foreground">Document ID: {document.id}</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Details & Document View */}
                <div className="space-y-6 lg:col-span-2">
                    <Card className="border-border bg-card shadow-sm overflow-hidden">
                        <div className="border-b bg-muted/80 px-6 py-4 flex items-center justify-between">
                            <h2 className="font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Document Information
                            </h2>
                            <Badge
                                variant="secondary"
                                className={
                                    document.status === "Completed" ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25" :
                                        document.status === "Pending" ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25" :
                                            "bg-red-500/20 text-red-800 dark:text-red-200 hover:bg-red-500/25"
                                }
                            >
                                {document.status}
                            </Badge>
                        </div>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border text-sm">
                                <div className="p-4 space-y-1">
                                    <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Initiator</span>
                                    <p className="font-medium text-foreground truncate">{document.initiator_name || "Unknown"}</p>
                                    <p className="text-muted-foreground truncate">{document.initiator_email}</p>
                                    {document.initiator_company && (
                                        <div className="mt-2 pt-2 border-t border-border">
                                            <p className="text-xs font-semibold text-foreground">{document.initiator_company}</p>
                                            {document.initiator_company_info && <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{document.initiator_company_info}</p>}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 space-y-1">
                                    <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Signer</span>
                                    <p className="font-medium text-foreground truncate">{document.signer_name}</p>
                                    <p className="text-muted-foreground truncate">{document.signer_email}</p>
                                    {document.signer_company && (
                                        <div className="mt-2 pt-2 border-t border-border">
                                            <p className="text-xs font-semibold text-foreground">{document.signer_company}</p>
                                            {document.signer_company_info && <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">{document.signer_company_info}</p>}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 space-y-1">
                                    <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Created</span>
                                    <p className="font-medium">{new Date(document.created_at).toLocaleString()}</p>
                                </div>
                                <div className="p-4 space-y-1">
                                    <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Expiration</span>
                                    <p className="font-medium">{new Date(document.expires_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-muted">
                                <h3 className="text-sm font-semibold mb-4">Document Actions</h3>
                                <div className="flex flex-wrap gap-4">
                                    {document.status === "Completed" ? (
                                        <Button asChild size="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                            <a href={document.signedUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                                                <Download className="h-4 w-4" />
                                                Download Final PDF
                                            </a>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button asChild variant="outline" size="default" className="gap-2">
                                                <a href={`/sign/${document.id}`} target="_blank" rel="noopener noreferrer" className="gap-2 inline-flex items-center">
                                                    <ExternalLink className="h-4 w-4 shrink-0" />
                                                    View Signing Page
                                                </a>
                                            </Button>
                                            <CopyLinkButton documentId={document.id} />
                                            <EmailSignersButton documentId={document.id} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PDF Preview rendering disabled for speed, but the download is enough for now */}
                </div>

                {/* Right Column: Audit Trail */}
                <div className="space-y-6">
                    <Card className="border-border bg-card shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="border-b bg-muted/80 px-6 py-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Audit Trail
                            </h2>
                        </div>
                        <CardContent className="flex-1 p-6 relative">
                            {/* Timeline Line Generator */}
                            <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-border" />

                            <div className="space-y-8 relative">
                                {auditLogs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No events recorded.</p>
                                ) : (
                                    auditLogs.map((log: any, i: number) => {
                                        const isLast = i === auditLogs.length - 1;
                                        let Icon = User;
                                        let iconBg = "bg-muted text-muted-foreground";
                                        let message = "System Action";

                                        if (log.action === "DOCUMENT_CREATED") {
                                            Icon = Plus;
                                            iconBg = "bg-primary/20 text-primary ring-4 ring-card";
                                            message = "Document prepared and sent over email.";
                                        } else if (log.action === "DOCUMENT_SIGNED") {
                                            Icon = CheckCircle2;
                                            iconBg = "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-4 ring-card";
                                            const d = log.details as { signer_name?: string } | null;
                                            message = d?.signer_name ? `${d.signer_name} signed electronically.` : "Document signed electronically via DocSign standard.";
                                        } else if (log.action === "EMAIL_SENT") {
                                            Icon = ShieldCheck;
                                            iconBg = "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-4 ring-card";
                                            const d = log.details as { to?: string; event?: string } | null;
                                            message = d?.to ? `Email sent to ${d.to}${d.event ? ` (${d.event})` : ""}.` : "Email sent.";
                                        } else if (log.action === "DOCUMENT_COMPLETED") {
                                            Icon = CheckCircle2;
                                            iconBg = "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-4 ring-card";
                                            message = "All signers completed; download link sent to everyone.";
                                        }

                                        return (
                                            <div key={log.id} className="relative flex gap-4">
                                                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg} z-10 shadow-sm`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 space-y-1 pb-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-foreground">{log.action.replace(/_/g, " ")}</h3>
                                                        <time className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </time>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{message}</p>
                                                    <p className="text-xs text-muted-foreground/80 font-mono mt-1">by: {log.actor_email}</p>
                                                    {(log.ip_address || (log.details && Object.keys(log.details).length > 0)) && (
                                                        <p className="text-xs text-muted-foreground/60 mt-0.5 break-all">
                                                            {log.ip_address && <span className="font-mono">IP: {log.ip_address}</span>}
                                                            {log.ip_address && log.details && Object.keys(log.details).length > 0 && " · "}
                                                            {log.details && typeof log.details === "object" && Object.keys(log.details).length > 0 && (
                                                                <span className="font-mono">{JSON.stringify(log.details)}</span>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
