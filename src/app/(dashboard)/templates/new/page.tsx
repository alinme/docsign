"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, ArrowRight, X, Loader2, GripHorizontal, User, Plus, ChevronDown, MoreHorizontal, PenTool, Calendar, Type, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveTemplate } from "@/actions/templates";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Dynamically import react-pdf to avoid SSR DOMMatrix issues
const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });
const pdfjs = await import("react-pdf").then(mod => mod.pdfjs).catch(() => null);

if (pdfjs) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type FieldType = "signature" | "date" | "text" | "checkbox";
interface TemplateBlock {
    id: string;
    type: FieldType;
    x: number;
    y: number;
    page: number;
    signerId: string;
}
interface TemplateSigner {
    id: string;
    name: string;
    email: string;
}

export default function NewTemplatePage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // At least one signer (name + email) so fields can be assigned
    const [signers, setSigners] = useState<TemplateSigner[]>([{ id: "signer-1", name: "", email: "" }]);
    const [selectedSignerIdForBlocks, setSelectedSignerIdForBlocks] = useState("signer-1");

    // PDF Rendering State
    const [numPages, setNumPages] = useState<number>(1);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfWidth, setPdfWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag and Drop (Signature Block) State - each block has type and signerId
    const [signatureBlocks, setSignatureBlocks] = useState<TemplateBlock[]>([{ id: "default", type: "signature", x: 100, y: 100, page: 1, signerId: "signer-1" }]);
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setPdfUrl(tempUrl);
            return () => URL.revokeObjectURL(tempUrl);
        } else {
            setPdfUrl(null);
        }
    }, [file]);

    // Measure container width when it's in the DOM and when it resizes (so PDF canvas gets correct size)
    useEffect(() => {
        const el = containerRef.current;
        if (!el || !pdfUrl) return;

        const updateWidth = () => {
            const w = el.clientWidth;
            if (w > 0) setPdfWidth(w);
        };

        updateWidth();
        const ro = new ResizeObserver(updateWidth);
        ro.observe(el);
        return () => ro.disconnect();
    }, [pdfUrl]);

    const handlePointerDown = (e: React.PointerEvent, id: string) => {
        if (!containerRef.current) return;
        setDraggingBlockId(id);

        const targetNode = e.currentTarget as HTMLElement;
        const blockRect = targetNode.getBoundingClientRect();

        setDragOffset({
            x: e.clientX - blockRect.left,
            y: e.clientY - blockRect.top
        });

        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingBlockId || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollTop = containerRef.current.scrollTop;
        const scrollLeft = containerRef.current.scrollLeft;

        let newX = e.clientX - containerRect.left + scrollLeft - dragOffset.x;
        let newY = e.clientY - containerRect.top + scrollTop - dragOffset.y;

        const blockWidth = 192; // 48 * 4 (w-48)
        const blockHeight = 64; // 16 * 4 (h-16)

        const maxX = containerRef.current.scrollWidth - blockWidth;
        const maxY = containerRef.current.scrollHeight - blockHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setSignatureBlocks(prev => prev.map(block =>
            block.id === draggingBlockId ? { ...block, x: newX, y: newY } : block
        ));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setDraggingBlockId(null);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const addSignatureBlock = (type: FieldType = "signature") => {
        setSignatureBlocks(prev => [
            ...prev,
            { id: `block-${Date.now()}`, type, x: 150 + prev.length * 20, y: 150 + prev.length * 20, page: 1, signerId: selectedSignerIdForBlocks }
        ]);
    };

    const removeSignatureBlock = (idToRemove: string) => {
        setSignatureBlocks(prev => prev.filter(block => block.id !== idToRemove));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSaveTemplate = async () => {
        const hasSigner = signers.length >= 1 && signers.some(s => s.name.trim() && s.email.trim());
        if (!file || !templateName || !hasSigner || signatureBlocks.length === 0) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("templateName", templateName);

            // Calculate percentage based coordinates for precise PDF mapping
            const renderedWidth = pdfWidth > 800 ? 800 : Math.max(0, pdfWidth - 64);
            const renderedHeight = renderedWidth * (11 / 8.5); // approximate standard letter
            const containerWidth = containerRef.current?.clientWidth || 0;
            const pdfLeftOffset = Math.max(0, (containerWidth - renderedWidth) / 2);

            const parsedBlocks = signatureBlocks.map(block => {
                const xRelative = block.x - pdfLeftOffset;
                let yRemaining = block.y - 32; // 32px top padding (py-8)
                let pageIndex = 0;
                while (yRemaining > renderedHeight + 16 && pageIndex < numPages - 1) { // 16px bottom margin (mb-4)
                    yRemaining -= (renderedHeight + 16);
                    pageIndex++;
                }

                const xPct = Math.max(0, Math.min(1, xRelative / renderedWidth));
                const yPct = Math.max(0, Math.min(1, yRemaining / renderedHeight));

                return {
                    ...block,
                    xPct,
                    yPct,
                    pageNum: pageIndex + 1,
                };
            });

            formData.append("signCoordinates", JSON.stringify(parsedBlocks));
            formData.append("signers", JSON.stringify(signers));

            const result = await saveTemplate(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Template saved successfully!");
                router.push("/templates");
            }
        } catch (error) {
            toast.error("Failed to save template");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Template</h1>
                    <p className="text-muted-foreground mt-1">Upload a PDF and place fields where signers will sign. When you use this template to create a document, you assign signers and these fields are applied to them.</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                {/* Left Column: PDF Viewer Canvas */}
                <div className="space-y-6">
                    <Card className={`py-0 w-full flex flex-col overflow-hidden bg-muted border-2 border-dashed border-border relative ${!file ? 'min-h-[800px] items-center justify-center' : 'h-[800px] min-h-[800px]'}`}>
                        {!file ? (
                            <div
                                className="w-full flex-1 flex flex-col items-center justify-center p-12 text-center min-h-0"
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <div className="rounded-full bg-primary/10 p-4">
                                    <UploadCloud className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold">Drag & Drop PDF here</h3>
                                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                                    or click below to select from your computer
                                </p>
                                <div className="mt-6">
                                    <Button asChild variant="outline" className="cursor-pointer font-semibold shadow-sm text-sm">
                                        <label htmlFor="file-upload">Select File</label>
                                    </Button>
                                    <input id="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileInput} />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Action bar: same as new document page */}
                                {pdfUrl && (
                                    <div className="flex items-center gap-1 p-2 rounded-lg border border-border bg-card shadow-sm">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="gap-1.5 border-border bg-background text-foreground hover:bg-muted min-w-[140px] justify-between">
                                                    <User className="h-4 w-4 shrink-0" />
                                                    {signers.find(s => s.id === selectedSignerIdForBlocks)?.name || `Signer ${(signers.findIndex(s => s.id === selectedSignerIdForBlocks) + 1) || 1}`}
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="min-w-[180px]">
                                                {signers.map((s, idx) => (
                                                    <DropdownMenuItem key={s.id} onClick={() => setSelectedSignerIdForBlocks(s.id)}>
                                                        Signer {idx + 1} {s.name ? `— ${s.name}` : ""}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Separator orientation="vertical" className="h-6 mx-1" />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="gap-1.5 border-border bg-background text-foreground hover:bg-muted">
                                                    <Plus className="h-4 w-4 shrink-0" />
                                                    Add field
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="min-w-[160px]">
                                                <DropdownMenuItem onClick={() => addSignatureBlock("signature")} className="text-amber-700 dark:text-amber-200">
                                                    <PenTool className="h-4 w-4 mr-2" /> Signature
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addSignatureBlock("date")}>
                                                    <Calendar className="h-4 w-4 mr-2" /> Date
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addSignatureBlock("text")} className="text-purple-700 dark:text-purple-200">
                                                    <Type className="h-4 w-4 mr-2" /> Text
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => addSignatureBlock("checkbox")} className="text-emerald-700 dark:text-emerald-200">
                                                    <CheckSquare className="h-4 w-4 mr-2" /> Checkbox
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Separator orientation="vertical" className="h-6 mx-1" />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="gap-1.5 border-border bg-background text-foreground hover:bg-muted ml-auto">
                                                    <MoreHorizontal className="h-4 w-4 shrink-0" />
                                                    Actions
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem variant="destructive" onClick={() => setFile(null)}>
                                                    <X className="h-4 w-4 mr-2" /> Remove PDF
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                                <div className="relative flex-1 w-full min-h-0 bg-secondary overflow-y-auto flex items-start justify-center py-8" ref={containerRef}>
                                    {pdfUrl && (
                                        <Document
                                            file={pdfUrl}
                                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                            className="shadow-xl"
                                        >
                                            {Array.from(new Array(numPages), (el, index) => (
                                                <div key={`page_${index + 1}`} className="mb-4 relative">
                                                    <Page
                                                        pageNumber={index + 1}
                                                        width={pdfWidth > 0 ? Math.min(800, pdfWidth - 32) : 800}
                                                        renderTextLayer={false}
                                                        renderAnnotationLayer={false}
                                                    />
                                                </div>
                                            ))}
                                        </Document>
                                    )}

                                    {/* Draggable blocks with type + signerId; remove button works via onPointerDown */}
                                    {signatureBlocks.map(block => (
                                        <div
                                            key={block.id}
                                            className={`absolute z-10 w-48 h-16 border-2 border-dashed rounded cursor-grab flex items-center justify-center shadow-lg transition-shadow
                                                ${block.type === "signature" ? "border-amber-500 bg-amber-100 dark:bg-amber-900/90 text-amber-900 dark:text-amber-100" :
                                                block.type === "date" ? "border-border bg-muted text-foreground" :
                                                block.type === "text" ? "border-purple-500 bg-purple-200 dark:bg-purple-900/80 text-purple-900 dark:text-purple-100" :
                                                "border-emerald-500 bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100"}
                                                ${draggingBlockId === block.id ? "cursor-grabbing shadow-xl ring-2 ring-amber-500" : ""}`}
                                            style={{
                                                left: `${block.x}px`,
                                                top: `${block.y}px`,
                                                touchAction: "none"
                                            }}
                                            onPointerDown={(e) => handlePointerDown(e, block.id)}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={handlePointerUp}
                                            onPointerCancel={handlePointerUp}
                                        >
                                            <div className="flex items-center justify-between w-full px-3 font-semibold text-sm">
                                                <div className="flex items-center gap-2 pointer-events-none">
                                                    <GripHorizontal className="h-4 w-4" />
                                                    {block.type === "signature" && "Sign Here"}
                                                    {block.type === "date" && "Date Signed"}
                                                    {block.type === "text" && "Text Input"}
                                                    {block.type === "checkbox" && "Checkbox"}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="p-1 hover:bg-background/50 rounded hover:text-destructive pointer-events-auto shrink-0"
                                                    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                                    onClick={(e) => { e.stopPropagation(); removeSignatureBlock(block.id); }}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </Card>
                </div>

                {/* Right Column: Details Form */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="template-name">Template Name</Label>
                                <Input
                                    id="template-name"
                                    placeholder="e.g. Employee NDA - 2026"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Name this form. When you &quot;Use template&quot;, signers below are prefilled and you can edit them on the new document page.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Signers</CardTitle>
                            <p className="text-sm text-muted-foreground">Add at least one signer (name + email). Fields you place on the PDF are assigned to the selected signer. You can edit signers when using this template.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {signers.map((s, idx) => (
                                <div key={s.id} className="space-y-2 rounded-lg border border-border p-3">
                                    {signers.length > 1 && (
                                        <div className="flex justify-end">
                                            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-destructive hover:text-destructive" onClick={() => {
                                                const next = signers.filter(sig => sig.id !== s.id);
                                                setSigners(next);
                                                if (selectedSignerIdForBlocks === s.id) setSelectedSignerIdForBlocks(next[0]?.id ?? "signer-1");
                                            }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`signer-name-${s.id}`}>Signer {idx + 1} Name</Label>
                                            <Button
                                                type="button"
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 text-muted-foreground hover:text-foreground text-xs"
                                                onClick={async () => {
                                                    const supabase = createClient();
                                                    const { data: { user } } = await supabase.auth.getUser();
                                                    if (!user) {
                                                        toast.error("You are not signed in.");
                                                        return;
                                                    }
                                                    const name = (user.user_metadata?.full_name as string) ?? user.email ?? "";
                                                    setSigners(signers.map(sig => sig.id === s.id ? { ...sig, name, email: user.email ?? "" } : sig));
                                                    toast.success("Filled with your details.");
                                                }}
                                            >
                                                Me
                                            </Button>
                                        </div>
                                        <Input id={`signer-name-${s.id}`} placeholder="e.g. Jane Doe" value={s.name} onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, name: e.target.value } : sig))} />
                                        <Label htmlFor={`signer-email-${s.id}`}>Signer {idx + 1} Email</Label>
                                        <Input id={`signer-email-${s.id}`} type="email" placeholder="jane@example.com" value={s.email} onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, email: e.target.value } : sig))} />
                                    </div>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={() => setSigners([...signers, { id: `signer-${Date.now()}`, name: "", email: "" }])}>
                                <Plus className="h-4 w-4" /> Add another signer
                            </Button>
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        size="lg"
                        disabled={!file || !templateName || !signers.some(s => s.name.trim() && s.email.trim()) || signatureBlocks.length === 0 || isLoading || !!draggingBlockId}
                        onClick={handleSaveTemplate}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        {isLoading ? "Saving..." : "Save Template"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
