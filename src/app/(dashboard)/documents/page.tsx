import { getRecentDocuments, deleteDocument } from "@/actions/documents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";

export default async function DocumentsPage() {
    const { data: documents, error } = await getRecentDocuments();

    const pendingDocs = documents?.filter(d => d.status === "Pending") || [];
    const completedDocs = documents?.filter(d => d.status === "Completed") || [];

    const DocumentTable = ({ docs, emptyMessage }: { docs: any[], emptyMessage: string }) => (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Document Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Signer</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date Sent</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {docs.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-4">
                                <EmptyState
                                    title="No documents found"
                                    description={emptyMessage}
                                    icon={FileText}
                                    actionLabel="New Document"
                                    actionHref="/new"
                                />
                            </td>
                        </tr>
                    )}
                    {docs.map((doc) => (
                        <tr key={doc.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-3 font-medium">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    {doc.file_name}
                                </div>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">{doc.signer_name} ({doc.signer_email})</td>
                            <td className="p-4 align-middle text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                            <td className="p-4 align-middle text-right">
                                <div className="flex justify-end items-center gap-2">
                                    <Link href={`/document/${doc.id}`}>
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                                            View
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

    return (
        <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your signature requests.</p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Document
                    </Link>
                </Button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-red-500 bg-red-50">
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
