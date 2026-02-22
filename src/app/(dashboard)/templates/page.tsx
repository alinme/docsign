import { getTemplates, deleteTemplate } from "@/actions/templates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, FileUp } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { DeleteButton } from "@/components/DeleteButton";

interface TemplateRow {
    id: string;
    template_name: string;
    sign_coordinates: unknown;
    signers?: unknown;
    created_at: string;
}

function TemplateTable({ templates, emptyMessage }: { templates: TemplateRow[]; emptyMessage: string }) {
    if (templates.length === 0) {
        return (
            <EmptyState
                title="No templates found"
                description={emptyMessage}
                icon={FileText}
                actionLabel="Create Template"
                actionHref="/templates/new"
            />
        );
    }
    const fieldCount = (coords: unknown) =>
        Array.isArray(coords) ? coords.length : 0;
    const signerCount = (signers: unknown) =>
        Array.isArray(signers) ? signers.length : 0;

    return (
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Template Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fields</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Signers</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {templates.map((template) => (
                        <tr key={template.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-3 font-medium">
                                    <FileText className="h-4 w-4 text-primary" />
                                    {template.template_name}
                                </div>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                                {fieldCount(template.sign_coordinates)} field(s)
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                                {signerCount(template.signers)} signer(s)
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                                {new Date(template.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle text-right">
                                <div className="flex justify-end items-center gap-2">
                                    <Link href={`/new?template=${template.id}`}>
                                        <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-background text-primary hover:bg-primary/15 hover:text-primary hover:border-primary/50" title="Use template">
                                            <FileUp className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <DeleteButton id={template.id} onDelete={deleteTemplate} itemName="template" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default async function TemplatesPage() {
    const { data: templates, error } = await getTemplates();

    const rows = (templates || []) as TemplateRow[];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
                    <p className="text-muted-foreground mt-1">Reusable PDF forms and signature placements. Use a template to create documents quickly.</p>
                </div>
                <Button asChild size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/templates/new" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Template
                    </Link>
                </Button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-destructive bg-destructive/10">
                    <p>Failed to load templates: {error}</p>
                </Card>
            ) : (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Your templates</CardTitle>
                        <CardDescription>Create a document from a template or manage templates below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TemplateTable templates={rows} emptyMessage="Create a template to reuse the same PDF and field positions for new documents." />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
