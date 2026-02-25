"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteButtonProps {
    id: string;
    onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>;
    itemName?: string;
}

export function DeleteButton({ id, onDelete, itemName = "item" }: DeleteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const t = useTranslations("Components");

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDeleting(true);
        try {
            const result = await onDelete(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                setOpen(false);
                toast.success(t("deleteSuccess", { itemName }));
                router.refresh();
            }
        } catch (error) {
            toast.error(t("unexpectedError"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-background text-destructive hover:bg-destructive/15 hover:text-destructive hover:border-destructive/50" title={t("delete")}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">{t("areYouSure")}</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        {t("deleteWarning", { itemName })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-wrap gap-3 sm:justify-end">
                    <AlertDialogCancel className="border-border bg-background text-foreground hover:bg-muted">{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleDelete(e); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="bg-red-600 text-white hover:bg-red-700 border-0 focus:ring-2 focus:ring-red-500 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                    >
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t("delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
