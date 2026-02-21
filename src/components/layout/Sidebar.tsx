"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Home, FileText, Settings, PenTool, Files, Plus, HelpCircle, Search, MoreVertical, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Documents", href: "/documents", icon: Files },
    { name: "Templates", href: "/templates", icon: FileText },
    { name: "Signatures", href: "/signatures", icon: PenTool },
];

export function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUser(data.user);
        });
    }, []);

    const email = user?.email || "User";
    const name = user?.user_metadata?.full_name || email;
    const initial = name.charAt(0).toUpperCase();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
            {/* Logo Header */}
            <div className="flex h-14 items-center gap-2 px-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground font-bold text-xs">
                    D
                </div>
                <span className="font-semibold text-sm">DocSign Inc.</span>
            </div>

            {/* Quick Create CTA */}
            <div className="px-3 py-2 flex gap-2">
                <Button asChild className="w-full justify-start gap-2 shadow-none bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 transition-opacity h-8 px-3 rounded-md" size="sm">
                    <Link href="/new">
                        <Plus className="h-3.5 w-3.5" />
                        <span className="text-xs">Quick Create</span>
                    </Link>
                </Button>
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 overflow-auto px-3 py-2">
                <div className="text-xs font-semibold text-sidebar-foreground/50 mb-2 mt-2 px-2">
                    Application
                </div>
                <nav className="space-y-0.5">
                    {navigation.map((item) => {
                        let isActive = pathname === item.href;
                        if (item.href !== "/") {
                            if (item.href === "/documents") {
                                isActive = pathname.startsWith("/documents") || pathname.startsWith("/document/");
                            } else {
                                isActive = pathname.startsWith(item.href);
                            }
                        }
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
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
            <div className="mt-auto p-3">
                <nav className="space-y-0.5 mb-2">
                    <Link href="/settings" className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80 transition-colors">
                        <Settings className="h-4 w-4 shrink-0" />
                        Settings
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80 transition-colors">
                        <HelpCircle className="h-4 w-4 shrink-0" />
                        Get Help
                    </Link>
                    <button className="w-full flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80 transition-colors">
                        <Search className="h-4 w-4 shrink-0" />
                        Search
                    </button>
                </nav>

                {/* User Profile */}
                <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-sidebar-accent transition-colors mt-2 cursor-pointer group">
                    <Avatar className="h-8 w-8 rounded-md shrink-0">
                        <AvatarFallback className="rounded-md bg-sidebar-primary/10 text-sidebar-primary font-semibold text-xs">{initial}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate group-hover:text-sidebar-accent-foreground text-sidebar-foreground/90">{name}</p>
                        <p className="text-xs text-sidebar-foreground/60 truncate mt-1">{email}</p>
                    </div>
                    <MoreVertical className="h-4 w-4 text-sidebar-foreground/50" />
                </div>
            </div>
        </div>
    );
}
