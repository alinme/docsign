import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { getRecentDocuments, deleteDocument } from "@/actions/documents";
import { DeleteButton } from "@/components/DeleteButton";

export default async function DashboardPage() {
    const { data: documents, error } = await getRecentDocuments();

    const activeCount = documents?.filter(d => d.status === "Pending").length || 0;
    const completedCount = documents?.filter(d => d.status === "Completed").length || 0;
    const voidedCount = documents?.filter(d => d.status === "Voided").length || 0;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your documents and track signature statuses securely.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/templates/new">
                        <Button variant="outline">
                            Create Template
                        </Button>
                    </Link>
                    <Link href="/new">
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4" />
                            New Document
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground truncate mr-2">Pending Signatures</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground truncate">Active requests</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground truncate mr-2">Completed Documents</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{completedCount}</div>
                        <p className="text-xs text-muted-foreground truncate">Signed and finalized</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground truncate mr-2">Voided / Expired</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{voidedCount}</div>
                        <p className="text-xs text-muted-foreground truncate">Archived</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        {error && <div className="p-4 text-red-500 bg-red-50 rounded-md">Failed to load documents: {error}</div>}

                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Document Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Signer</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date Sent</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {documents?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-4">
                                            <EmptyState
                                                title="No documents yet"
                                                description="Create your first document to get started."
                                                icon={FileText}
                                                actionLabel="New Document"
                                                actionHref="/new"
                                            />
                                        </td>
                                    </tr>
                                )}

                                {documents?.slice(0, 5).map((doc) => (
                                    <tr key={doc.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3 font-medium">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                {doc.file_name}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">{doc.signer_name} ({doc.signer_email})</td>
                                        <td className="p-4 align-middle">
                                            <Badge
                                                variant="secondary"
                                                className={
                                                    doc.status === "Completed" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" :
                                                        doc.status === "Pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                                                            "bg-red-100 text-red-800 hover:bg-red-100"
                                                }
                                            >
                                                {doc.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                <Link href={`/document/${doc.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                                                        View Details
                                                    </Button>
                                                </Link>
                                                <DeleteButton id={doc.id} onDelete={deleteDocument} itemName="document" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
