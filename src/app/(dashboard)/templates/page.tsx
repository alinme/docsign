import { getTemplates, deleteTemplate } from "@/actions/templates";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { DeleteButton } from "@/components/DeleteButton";

export default async function TemplatesPage() {
    const { data: templates, error } = await getTemplates();

    return (
        <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Reusable Templates</h1>
                    <p className="text-muted-foreground mt-1">Manage your saved PDF forms and signature placements.</p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/templates/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                    </Link>
                </Button>
            </div>

            {error ? (
                <Card className="p-8 text-center text-destructive bg-destructive/10">
                    <p>Failed to load templates. Please try again.</p>
                </Card>
            ) : !templates || templates.length === 0 ? (
                <EmptyState
                    title="No templates found"
                    description="Upload a document once and save the signature locations to quickly send it to new signers in the future."
                    icon={FileText}
                    actionLabel="Create your first Template"
                    actionHref="/templates/new"
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="text-xs font-medium bg-muted px-2 py-1 rounded text-muted-foreground flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                                <h3 className="font-semibold line-clamp-1 mb-1" title={template.template_name}>
                                    {template.template_name}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 line-clamp-1">
                                    Includes {Array.isArray(template.sign_coordinates) ? template.sign_coordinates.length : 1} signature block(s)
                                </p>

                                <div className="mt-auto pt-4 border-t flex items-center gap-2">
                                    <Button asChild variant="outline" className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                                        <Link href={`/new?template=${template.id}`}>
                                            Use Template
                                        </Link>
                                    </Button>
                                    <DeleteButton id={template.id} onDelete={deleteTemplate} itemName="template" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
