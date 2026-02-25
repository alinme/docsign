"use client";

import { useState, useEffect } from "react";
import { SidebarContent } from "@/components/layout/SidebarContent";

const LG_BREAKPOINT = 1024;

export function Sidebar() {
    // Only render sidebar at lg+ so it's never in the DOM on mobile
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
        const update = () => setShowSidebar(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    if (!showSidebar) return null;

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
            <SidebarContent />
        </aside>
    );
}
