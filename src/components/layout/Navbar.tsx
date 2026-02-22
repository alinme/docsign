import { Bell, LogOut } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Navbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const t = await getTranslations("Navigation");
    const email = user?.email || t("user");
    const name = user?.user_metadata?.full_name || email;
    const initial = name.charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-6 border-b border-border bg-background/80 px-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex flex-1 items-center pr-4">
                    <SearchInput />
                </div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <span className="sr-only">{t("viewNotifications")}</span>
                        <Bell className="h-5 w-5" aria-hidden="true" />
                    </Button>

                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

                    {/* Profile Section */}
                    <div className="flex items-center gap-x-4">
                        <Link href="/profile" className="flex items-center gap-x-4 hover:opacity-80 transition-opacity">
                            <span className="text-sm font-medium hidden lg:block">{name}</span>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{initial}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <form action={logout}>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" type="submit" title={t("logout")}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    );
}
