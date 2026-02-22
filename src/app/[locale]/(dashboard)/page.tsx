import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getRecentDocuments, deleteDocument } from "@/actions/documents";
import { DeleteButton } from "@/components/DeleteButton";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
    const t = await getTranslations("Dashboard");
    const { data: documents, error } = await getRecentDocuments();

    const activeCount = documents?.filter(d => d.status === "Pending").length || 0;
    const completedCount = documents?.filter(d => d.status === "Completed").length || 0;
    const voidedCount = documents?.filter(d => d.status === "Voided").length || 0;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </div>
                <div className="flex gap-4">
                    <Button asChild variant="outline" size="lg" className="gap-2">
                        <Link href="/templates/new" className="gap-2">
                            <FileText className="h-4 w-4" />
                            {t("createTemplate")}
                        </Link>
                    </Button>
                    <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href="/new" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t("newDocument")}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground truncate mr-2">{t("pendingSignatures")}</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground truncate">{t("activeRequests")}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground truncate mr-2">{t("completedDocuments")}</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{completedCount}</div>
                        <p className="text-xs text-muted-foreground truncate">{t("signedAndFinalized")}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm flex flex-col justify-between h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground truncate mr-2">{t("voidedOrExpired")}</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{voidedCount}</div>
                        <p className="text-xs text-muted-foreground truncate">{t("archived")}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>{t("recentDocuments")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && <div className="p-4 text-destructive bg-destructive/10 rounded-md">{t("failedToLoad")} {error}</div>}

                    {!error && (!documents || documents.length === 0) && (
                        <EmptyState
                            title={t("noDocumentsYet")}
                            description={t("createFirstDocument")}
                            icon={FileText}
                            actionLabel={t("newDocument")}
                            actionHref="/new"
                        />
                    )}

                    {!error && documents && documents.length > 0 && (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t("documentName")}</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t("signers")}</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t("status")}</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t("dateSent")}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">{t("actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {documents.slice(0, 5).map((doc) => (
                                        <tr key={doc.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3 font-medium">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    {doc.file_name}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                {(() => {
                                                    const signers = (doc as any).signers || [];
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
                                                        <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-background text-primary hover:bg-primary/15 hover:text-primary hover:border-primary/50" title={t("viewDetails")}>
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
