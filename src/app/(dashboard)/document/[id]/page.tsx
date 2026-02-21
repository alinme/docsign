import { getDocumentById, getAuditLogs } from "@/actions/documents";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Download, ShieldCheck, Clock, User, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyLinkButton from "./copy-link-button";

export default async function DocumentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const docResult = await getDocumentById(id);
    const logsResult = await getAuditLogs(id);

    if (docResult.error || !docResult.data) {
        return (
            <div className="mx-auto max-w-5xl space-y-8 pb-12">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-red-900">Document Not Found</h1>
                        <p className="text-sm text-red-500">Error: {docResult.error || "The document you are looking for has been deleted or does not exist."}</p>
                    </div>
                </div>
            </div>
        );
    }

    const document = docResult.data;
    const auditLogs = logsResult.data || [];

    return (
        <div className="mx-auto max-w-5xl space-y-8 pb-12">
            <div className="flex items-center gap-4">
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
                                    document.status === "Completed" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" :
                                        document.status === "Pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                                            "bg-red-100 text-red-800 hover:bg-red-100"
                                }
                            >
                                {document.status}
                            </Badge>
                        </div>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-y border-b text-sm">
                                <div className="p-4 space-y-1">
                                    <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Initiator</span>
                                    <p className="font-medium text-gray-900 truncate">{document.initiator_name || "Unknown"}</p>
                                    <p className="text-gray-500 truncate">{document.initiator_email}</p>
                                    {document.initiator_company && (
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="text-xs font-semibold text-gray-700">{document.initiator_company}</p>
                                            {document.initiator_company_info && <p className="text-xs text-gray-500 whitespace-pre-wrap mt-1">{document.initiator_company_info}</p>}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 space-y-1">
                                    <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">Signer</span>
                                    <p className="font-medium text-gray-900 truncate">{document.signer_name}</p>
                                    <p className="text-gray-500 truncate">{document.signer_email}</p>
                                    {document.signer_company && (
                                        <div className="mt-2 pt-2 border-t">
                                            <p className="text-xs font-semibold text-gray-700">{document.signer_company}</p>
                                            {document.signer_company_info && <p className="text-xs text-gray-500 whitespace-pre-wrap mt-1">{document.signer_company_info}</p>}
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
                                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                                            <a href={document.signedUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="mr-2 h-4 w-4" />
                                                Download Final PDF
                                            </a>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button asChild variant="outline">
                                                <a href={`/sign/${document.id}`} target="_blank" rel="noopener noreferrer">
                                                    View Signing Page
                                                </a>
                                            </Button>
                                            <CopyLinkButton documentId={document.id} />
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
                            <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-gray-100" />

                            <div className="space-y-8 relative">
                                {auditLogs.length === 0 ? (
                                    <p className="text-sm text-gray-500">No events recorded.</p>
                                ) : (
                                    auditLogs.map((log: any, i: number) => {
                                        const isLast = i === auditLogs.length - 1;
                                        let Icon = User;
                                        let iconBg = "bg-gray-100 text-gray-500";
                                        let message = "System Action";

                                        if (log.action === "DOCUMENT_CREATED") {
                                            Icon = Plus;
                                            iconBg = "bg-blue-100 text-blue-600 ring-4 ring-white";
                                            message = "Document prepared and sent over email.";
                                        } else if (log.action === "DOCUMENT_SIGNED") {
                                            Icon = CheckCircle2;
                                            iconBg = "bg-emerald-100 text-emerald-600 ring-4 ring-white";
                                            message = "Document signed electronically via DocSign standard.";
                                        }

                                        return (
                                            <div key={log.id} className="relative flex gap-4">
                                                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg} z-10 shadow-sm`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 space-y-1 pb-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-gray-900">{log.action.replace("_", " ")}</h3>
                                                        <time className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </time>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{message}</p>
                                                    <p className="text-xs text-gray-400 font-mono mt-1">by: {log.actor_email}</p>
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
