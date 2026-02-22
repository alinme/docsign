"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function CopyLinkButton({ documentId }: { documentId: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const url = `${window.location.origin}/sign/${documentId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("Signing link copied to clipboard");
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    return (
        <Button variant="outline" size="default" className="gap-2" onClick={handleCopy}>
            {copied ? (
                <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-50 duration-200" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
            Copy Signing Link
        </Button>
    );
}
