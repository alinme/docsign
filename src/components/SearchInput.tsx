"use client";

import { useState, useRef, useEffect } from "react";
import { Search, FileText, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchDocuments } from "@/actions/documents";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function SearchInput() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                setIsLoading(true);
                const res = await searchDocuments(query);
                if (res.data) setResults(res.data);
                setIsLoading(false);
                setIsOpen(true);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div ref={wrapperRef} className="relative flex flex-1 h-10 w-full max-w-lg">
            <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
            />
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.trim().length > 1) setIsOpen(true); }}
                className="pl-9 pr-8 py-2 w-full bg-muted/50 border-border focus-visible:ring-ring transition-all rounded-full h-full text-sm placeholder:text-muted-foreground focus:bg-background focus:shadow-sm"
                placeholder="Search documents or signers..."
                type="text"
            />
            {query && (
                <button
                    onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full p-0.5"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-12 left-0 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {isLoading ? (
                        <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto p-2">
                            {results.map((doc) => (
                                <Link
                                    key={doc.id}
                                    href={`/document/${doc.id}`}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-start gap-3 p-3 hover:bg-accent rounded-lg transition-colors group cursor-pointer"
                                >
                                    <div className="bg-primary/10 p-2 rounded-md group-hover:bg-primary/20 transition-colors">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">
                                            {doc.file_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {doc.signer_name || doc.signer_email}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                        {doc.status}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No documents found matching "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
