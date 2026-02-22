"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { emailDocumentSigners } from "@/actions/documents";
import { useTranslations } from "next-intl";

export function EmailSignersButton({ documentId }: { documentId: string }) {
    const [sending, setSending] = useState(false);
    const router = useRouter();
    const t = useTranslations("Components");

    const handleClick = async () => {
        setSending(true);
        try {
            const result = await emailDocumentSigners(documentId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(t("signersEmailed"));
                router.refresh();
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="default"
            className="gap-2"
            onClick={handleClick}
            disabled={sending}
            title={t("emailSignersTitle")}
        >
            {sending ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
                <Mail className="h-4 w-4 shrink-0" />
            )}
            {t("emailSignersBtn")}
        </Button>
    );
}
