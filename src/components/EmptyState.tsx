import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    actionOnClick?: () => void;
}

export function EmptyState({ title, description, icon: Icon, actionLabel, actionHref, actionOnClick }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-lg bg-muted/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
            {actionLabel && actionHref && (
                <Link href={actionHref}>
                    <Button>
                        {actionLabel}
                    </Button>
                </Link>
            )}
            {actionLabel && actionOnClick && !actionHref && (
                <Button onClick={actionOnClick}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
