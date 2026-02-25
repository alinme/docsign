"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Home, FileText, Settings, Files, Plus, MoreVertical, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo/Logo";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SidebarContentProps {
    onNavigate?: () => void;
    className?: string;
}

export function SidebarContent({ onNavigate, className }: SidebarContentProps) {
    const pathname = usePathname();
    const t = useTranslations("Navigation");
    const [user, setUser] = useState<any>(null);

    const navigation = useMemo(() => [
        { name: t("dashboard"), href: "/", icon: Home },
        { name: t("documents"), href: "/documents", icon: Files },
        { name: t("templates"), href: "/templates", icon: FileText },
    ], [t]);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUser(data.user);
        });
    }, []);

    const email = user?.email || t("user");
    const name = user?.user_metadata?.full_name || email;
    const initial = name.charAt(0).toUpperCase();

    return (
        <div className={cn("flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground", className)}>
            {/* Logo Header */}
            <div className="flex h-14 items-center gap-2 px-4">
                <Logo className="w-8 h-8" />
                <div className="flex flex-col gap-0">
                    <span className="font-semibold text-sm">{t("docSignInc")}</span>
                    <span className="text-xs text-sidebar-foreground/50">{t("application")}</span>
                </div>
            </div>

            {/* Quick Create CTA */}
            <div className="px-3 py-2 flex gap-2">
                <Button asChild className="w-full justify-start gap-2 shadow-none bg-sidebar-primary text-sidebar-primary-foreground hover:!bg-sidebar-primary hover:!text-sidebar-primary-foreground dark:hover:!bg-sidebar-primary dark:hover:!text-sidebar-primary-foreground hover:brightness-110 transition-[filter] h-8 px-3 rounded-md" size="sm">
                    <Link href="/new" onClick={onNavigate}>
                        <Plus className="h-3.5 w-3.5" />
                        <span className="text-xs">{t("quickCreate")}</span>
                    </Link>
                </Button>
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 overflow-auto px-3 py-2">
                <div className="text-xs font-semibold text-sidebar-foreground/50 mb-2 mt-2 px-2">
                    {t("application")}
                </div>
                <nav className="space-y-0.5">
                    {navigation.map((item) => {
                        const path = pathname || "";
                        let isActive = path === item.href;
                        if (item.href === "/") {
                            isActive = path === "/";
                        } else if (item.href === "/documents") {
                            isActive = path.startsWith("/documents") || path.startsWith("/document/") || path === "/new";
                        } else {
                            isActive = path.startsWith(item.href);
                        }
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="mt-auto p-3 border-t border-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-sidebar-accent transition-colors mt-2 cursor-pointer group w-full">
                            <Avatar className="h-8 w-8 rounded-md shrink-0">
                                <AvatarFallback className="rounded-md bg-sidebar-primary/10 text-sidebar-primary font-semibold text-xs">{initial}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden min-w-0">
                                <p className="text-sm font-medium leading-none truncate group-hover:text-sidebar-accent-foreground text-sidebar-foreground/90">{name}</p>
                                <p className="text-xs text-sidebar-foreground/60 truncate mt-1">{email}</p>
                            </div>
                            <MoreVertical className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56">
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2" onClick={onNavigate}>
                                <UserCircle className="h-4 w-4" />
                                {t("editProfile")}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center gap-2" onClick={onNavigate}>
                                <Settings className="h-4 w-4" />
                                {t("settings")}
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
