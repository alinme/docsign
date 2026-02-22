import { getRecentDocuments, deleteDocument } from "@/actions/documents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Eye } from "lucide-react";
import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";

interface DocumentRow {
    id: string;
    file_name: string;
    status: string;
    signer_name: string;
    signer_email: string;
    signers?: { id: string; name: string; email: string }[];
    created_at: string;
}

function DocumentTable({ docs, emptyMessage }: { docs: DocumentRow[]; emptyMessage: string }) {
    if (docs.length === 0) {
        return (
            <EmptyState
                title="No documents found"
                description={emptyMessage}
                icon={FileText}
                actionLabel="New Document"
                actionHref="/new"
            />
        );
    }
    return (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Document Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Signer(s)</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date Sent</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {docs.map((doc) => (
                        <tr key={doc.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-3 font-medium">
                                    <FileText className="h-4 w-4 text-primary" />
                                    {doc.file_name}
                                </div>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                                {(() => {
                                    const signers = doc.signers || [];
                                    const first = signers[0];
                                    const name = first?.name ?? doc.signer_name;
                                    const email = first?.email ?? doc.signer_email;
                                    const extra = signers.length > 1 ? ` +${signers.length - 1}` : "";
                                    return `${name}${extra} (${email})`;
                                })()}
                            </td>
                            <td className="p-4 align-middle">
                                <Badge
                                    variant="secondary"
                                    className={
                                        doc.status === "Completed" ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25" :
                                            doc.status === "Pending" ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25" :
                                                "bg-red-500/20 text-red-800 dark:text-red-200 hover:bg-red-500/25"
                                    }
                                >
                                    {doc.status}
                                </Badge>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                            <td className="p-4 align-middle text-right">
                                <div className="flex justify-end items-center gap-2">
                                    <Link href={`/document/${doc.id}`}>
                                        <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-background text-primary hover:bg-primary/15 hover:text-primary hover:border-primary/50" title="View document">
                                            <Eye className="h-4 w-4" />
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
    );
}

export default async function DocumentsPage() {
    const { data: documents, error } = await getRecentDocuments();

    const pendingDocs = (documents?.filter(d => d.status === "Pending") || []) as DocumentRow[];
    const completedDocs = (documents?.filter(d => d.status === "Completed") || []) as DocumentRow[];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your signature requests.</p>
                </div>
                <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/new" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Document
                    </Link>
                </Button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-destructive bg-destructive/10">
                    <p>Failed to load documents: {error}</p>
                </Card>
            ) : (
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="pending">
                            Pending ({pendingDocs.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                            Completed ({completedDocs.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Unsigned Documents</CardTitle>
                                <CardDescription>Documents waiting for the recipient to sign.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DocumentTable docs={pendingDocs} emptyMessage="No pending documents found." />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="completed">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Signed Documents</CardTitle>
                                <CardDescription>Documents that have been fully signed and finalized.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DocumentTable docs={completedDocs} emptyMessage="No completed documents found." />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
