"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, File, ArrowRight, X, Loader2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
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

export default function NewTemplatePage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // PDF Rendering State
    const [numPages, setNumPages] = useState<number>(1);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfWidth, setPdfWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag and Drop (Signature Block) State
    const [signatureBlocks, setSignatureBlocks] = useState([{ id: 'default', x: 100, y: 100, page: 1 }]);
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

    useEffect(() => {
        if (containerRef.current) {
            setPdfWidth(containerRef.current.clientWidth);
        }
    }, [file]);

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

    const addSignatureBlock = () => {
        setSignatureBlocks(prev => [
            ...prev,
            { id: `block-${Date.now()}`, x: 150 + prev.length * 20, y: 150 + prev.length * 20, page: 1 }
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
        if (!file || !templateName) return;

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
        <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Create Template</h1>
                    <p className="text-muted-foreground mt-1">Upload a PDF and configure signature block placement for future use.</p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                {/* Left Column: PDF Viewer Canvas */}
                <div className="space-y-6">
                    <Card className={`py-0 min-h-[800px] w-full flex flex-col overflow-hidden bg-muted border-2 border-dashed border-border relative ${!file ? 'items-center justify-center' : ''}`}>
                        {!file ? (
                            <div
                                className="w-full flex-1 flex flex-col items-center justify-center p-12 text-center"
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
                            <div className="relative flex-1 w-full bg-secondary overflow-y-auto flex items-start justify-center py-8" ref={containerRef}>
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
                                                    width={pdfWidth > 800 ? 800 : Math.max(0, pdfWidth - 64)}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                />
                                            </div>
                                        ))}
                                    </Document>
                                )}

                                {/* The Draggable Signature Blocks */}
                                {signatureBlocks.map(block => (
                                    <div
                                        key={block.id}
                                        className={`absolute z-10 w-48 h-16 bg-blue-100/80 border-2 border-blue-600 border-dashed rounded cursor-grab flex items-center justify-center shadow-lg transition-shadow ${draggingBlockId === block.id ? 'cursor-grabbing shadow-xl ring-2 ring-blue-400' : ''}`}
                                        style={{
                                            left: `${block.x}px`,
                                            top: `${block.y}px`,
                                            touchAction: 'none'
                                        }}
                                        onPointerDown={(e) => handlePointerDown(e, block.id)}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                    >
                                        <div className="flex items-center justify-between w-full px-3 text-blue-800 font-semibold text-sm">
                                            <div className="flex items-center gap-2 pointer-events-none">
                                                <GripHorizontal className="h-4 w-4" />
                                                Sign Here
                                            </div>
                                            {signatureBlocks.length > 1 && (
                                                <button
                                                    className="p-1 hover:bg-background/50 rounded text-primary hover:text-destructive pointer-events-auto"
                                                    onClick={(e) => { e.stopPropagation(); removeSignatureBlock(block.id); }}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Actions overlay */}
                                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="shadow-lg bg-card hover:bg-accent text-primary font-semibold border-primary/20"
                                        onClick={addSignatureBlock}
                                    >
                                        + Add Signature Field
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="shadow-lg font-semibold"
                                        onClick={() => setFile(null)}
                                    >
                                        <X className="h-4 w-4 mr-1" /> Remove PDF
                                    </Button>
                                </div>
                            </div>
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
                                <p className="text-xs text-muted-foreground">Provide a clear name to recognize this form later.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                        disabled={!file || !templateName || isLoading || !!draggingBlockId}
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
