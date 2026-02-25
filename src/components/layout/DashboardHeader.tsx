"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/SidebarContent";
import { useTranslations } from "next-intl";

export function DashboardHeader({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const t = useTranslations("Navigation");

    return (
        <>
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-2 border-b border-border bg-background/80 px-4 shadow-sm backdrop-blur-xl sm:gap-x-4 sm:px-6 lg:gap-x-6 lg:px-8">
                <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(true)}
                    aria-label={t("openMenu")}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="flex flex-1 items-center gap-x-4 self-stretch min-w-0 lg:gap-x-6">
                    {children}
                </div>
            </header>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="left"
                    className="w-64 max-w-[16rem] p-0 gap-0 border-r bg-sidebar text-sidebar-foreground"
                    showCloseButton={true}
                >
                    <SheetTitle className="sr-only">{t("openMenu")}</SheetTitle>
                    <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}
