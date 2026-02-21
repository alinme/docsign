"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export default function CopyLinkButton({ documentId }: { documentId: string }) {
    const handleCopy = () => {
        // Need to check for window due to Next.js SSR, but since it's an action it implies client-side click anyway
        const url = `${window.location.origin}/sign/${documentId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("Signing link copied to clipboard");
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    return (
        <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Signing Link
        </Button>
    );
}
