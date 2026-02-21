"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, File, ArrowRight, X, Loader2, Link2, GripHorizontal, Calendar, Type, CheckSquare, PenTool, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadDocument } from "@/actions/documents";
import { getTemplateById } from "@/actions/templates";
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

export default function NewDocumentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams.get("template");

    const [file, setFile] = useState<File | null>(null);
    interface SignerInfo {
        id: string;
        name: string;
        email: string;
    }
    const [signers, setSigners] = useState<SignerInfo[]>([{ id: 'signer-1', name: '', email: '' }]);
    const [selectedSignerIdForBlocks, setSelectedSignerIdForBlocks] = useState('signer-1');
    const [signerIsBusiness, setSignerIsBusiness] = useState(false);
    const [signerCompany, setSignerCompany] = useState("");
    const [signerCompanyInfo, setSignerCompanyInfo] = useState("");
    const [expirationDays, setExpirationDays] = useState("7");
    const [isLoading, setIsLoading] = useState(false);

    // PDF Rendering State
    const [numPages, setNumPages] = useState<number>(1);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfWidth, setPdfWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag and Drop (Signature Block) State
    type FieldType = 'signature' | 'date' | 'text' | 'checkbox';
    interface DocumentField {
        id: string;
        type: FieldType;
        x: number;
        y: number;
        page: number;
        xPct?: number;
        yPct?: number;
        pageNum?: number;
        signerId: string;
    }

    const [signatureBlocks, setSignatureBlocks] = useState<DocumentField[]>([{ id: 'default', type: 'signature', x: 100, y: 100, page: 1, signerId: 'signer-1' }]);
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        async function loadTemplate() {
            if (templateId) {
                const result = await getTemplateById(templateId);
                if (result.data) {
                    if (result.data.signedUrl) {
                        setPdfUrl(result.data.signedUrl);
                    }
                    if (result.data.sign_coordinates) {
                        // Templates use percentage coordinates since they are already saved
                        setSignatureBlocks(result.data.sign_coordinates);
                    }
                }
            } else if (file) {
                const tempUrl = URL.createObjectURL(file);
                setPdfUrl(tempUrl);
                return () => URL.revokeObjectURL(tempUrl);
            } else {
                setPdfUrl(null);
            }
        }
        loadTemplate();
    }, [file, templateId]);

    useEffect(() => {
        if (containerRef.current) {
            setPdfWidth(containerRef.current.clientWidth);
        }
    }, [file]); // recalculate when file is loaded

    const handlePointerDown = (e: React.PointerEvent, id: string) => {
        if (!containerRef.current) return;
        setDraggingBlockId(id);

        // Find the specific node that was clicked to calculate offset correctly
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

        // Use hardcoded width/height since blockRef may not point to the dragged item in an array map
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

    const addSignatureBlock = (type: FieldType = 'signature') => {
        setSignatureBlocks(prev => [
            ...prev,
            { id: `block-${Date.now()}`, type, x: 150 + (prev.length * 20), y: 150 + (prev.length * 20), page: 1, signerId: selectedSignerIdForBlocks }
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

    const handleUpload = async () => {
        const hasMissingSignerInfo = signers.some(s => !s.name.trim() || !s.email.trim());
        if ((!file && !templateId) || hasMissingSignerInfo) return;

        setIsLoading(true);
        try {
            const formData = new FormData();

            if (templateId) {
                formData.append("templateId", templateId);
            } else if (file) {
                formData.append("file", file);
            }

            formData.append("signers", JSON.stringify(signers));
            formData.append("expirationDays", expirationDays);
            formData.append("signerIsBusiness", signerIsBusiness ? "true" : "false");
            if (signerIsBusiness) {
                formData.append("signerCompany", signerCompany);
                formData.append("signerCompanyInfo", signerCompanyInfo);
            }

            // Only calculate coordinates if we are dealing with a fresh PDF file
            if (!templateId) {
                // Calculate percentage based coordinates for precise PDF mapping
                const renderedWidth = pdfWidth > 800 ? 800 : Math.max(0, pdfWidth - 64);
                const renderedHeight = renderedWidth * (11 / 8.5); // approximate standard letter
                const containerWidth = containerRef.current?.clientWidth || 0;
                const pdfLeftOffset = Math.max(0, (containerWidth - renderedWidth) / 2);

                // Process all mapped signature blocks
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

                // Append signature blocks configuration array
                formData.append("signCoordinates", JSON.stringify(parsedBlocks));
            }

            const result = await uploadDocument(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Document sent successfully!");
                router.push("/");
            }
        } catch (error) {
            toast.error("Failed to send document");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Prepare Document</h1>
                <p className="text-muted-foreground">Upload a PDF, add signer details, and place the signature block.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                {/* Left Column: PDF Viewer Canvas */}
                <div className="space-y-6">
                    <Card className={`py-0 min-h-[800px] w-full flex flex-col overflow-hidden bg-muted border-2 border-dashed border-border relative ${!pdfUrl ? 'items-center justify-center' : ''}`}>
                        {!pdfUrl ? (
                            <div
                                className="py-6 w-full flex-1 flex flex-col items-center justify-center p-12 text-center"
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
                                                    width={pdfWidth > 800 ? 800 : pdfWidth - 64}
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
                                        className={`absolute z-10 w-48 h-16 border-2 border-dashed rounded flex items-center justify-center shadow-lg transition-shadow 
                                            ${templateId ? 'pointer-events-none' : 'cursor-grab'}
                                            ${block.type === 'signature' ? 'bg-blue-100/80 border-blue-600 text-blue-800' :
                                                block.type === 'date' ? 'bg-gray-100/80 border-gray-600 text-gray-800' :
                                                    block.type === 'text' ? 'bg-purple-100/80 border-purple-600 text-purple-800' :
                                                        'bg-green-100/80 border-green-600 text-green-800'
                                            }
                                            ${draggingBlockId === block.id && !templateId ? 'cursor-grabbing shadow-xl ring-2 ring-current' : ''}`}
                                        style={{
                                            left: (block.xPct !== undefined) ? `${block.xPct * 100}%` : `${block.x}px`,
                                            top: (block.yPct !== undefined) ? `${block.yPct * 100}%` : `${block.y}px`,
                                            touchAction: 'none'
                                        }}
                                        onPointerDown={!templateId ? (e) => handlePointerDown(e, block.id) : undefined}
                                        onPointerMove={!templateId ? handlePointerMove : undefined}
                                        onPointerUp={!templateId ? handlePointerUp : undefined}
                                        onPointerCancel={!templateId ? handlePointerUp : undefined}
                                    >
                                        <div className="flex items-center justify-between w-full px-3 font-semibold text-sm">
                                            <div className="flex items-center gap-2 pointer-events-none">
                                                <GripHorizontal className="h-4 w-4" />
                                                {block.type === 'signature' && 'Sign Here'}
                                                {block.type === 'date' && 'Date Signed'}
                                                {block.type === 'text' && 'Text Input'}
                                                {block.type === 'checkbox' && 'Checkbox'}
                                            </div>
                                            {!templateId && signatureBlocks.length > 1 && (
                                                <button
                                                    className="p-1 hover:bg-white/50 rounded hover:text-red-500 pointer-events-auto transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); removeSignatureBlock(block.id); }}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                    {!templateId && (
                                        <div className="bg-card rounded-lg shadow-lg border p-2 flex flex-col gap-2 pointer-events-auto">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">Assigned To</p>
                                            <select
                                                className="mb-2 text-sm border rounded p-1 mx-2 bg-transparent"
                                                value={selectedSignerIdForBlocks}
                                                onChange={(e) => setSelectedSignerIdForBlocks(e.target.value)}
                                            >
                                                {signers.map((s, idx) => (
                                                    <option key={s.id} value={s.id}>
                                                        Signer {idx + 1} {s.name ? `(${s.name})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2 mt-2">Add Fields</p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                                                onClick={() => addSignatureBlock('signature')}
                                            >
                                                <PenTool className="h-4 w-4 mr-2" /> Signature
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="justify-start bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                                                onClick={() => addSignatureBlock('date')}
                                            >
                                                <Calendar className="h-4 w-4 mr-2" /> Date Signed
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium"
                                                onClick={() => addSignatureBlock('text')}
                                            >
                                                <Type className="h-4 w-4 mr-2" /> Text Input
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="justify-start bg-green-50 hover:bg-green-100 text-green-700 font-medium"
                                                onClick={() => addSignatureBlock('checkbox')}
                                            >
                                                <CheckSquare className="h-4 w-4 mr-2" /> Checkbox
                                            </Button>
                                        </div>
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="shadow-lg font-semibold mt-4"
                                        onClick={() => {
                                            if (templateId) {
                                                router.push("/templates");
                                            } else {
                                                setFile(null);
                                            }
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-1" /> {templateId ? 'Exit Template' : 'Remove PDF'}
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
                            <CardTitle>Signer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {signers.map((s, idx) => (
                                <div key={s.id} className="space-y-4 p-4 border rounded-md relative bg-card">
                                    {signers.length > 1 && (
                                        <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500" onClick={() => {
                                            const filteredSigners = signers.filter(sig => sig.id !== s.id);
                                            setSigners(filteredSigners);
                                            if (selectedSignerIdForBlocks === s.id) {
                                                setSelectedSignerIdForBlocks(filteredSigners[0].id);
                                            }
                                        }}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Signer {idx + 1} Name</Label>
                                        <Input
                                            placeholder="e.g. Jane Doe"
                                            value={s.name}
                                            onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, name: e.target.value } : sig))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Signer {idx + 1} Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="jane@example.com"
                                            value={s.email}
                                            onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, email: e.target.value } : sig))}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setSigners([...signers, { id: `signer-${Date.now()}`, name: '', email: '' }])}>
                                <Plus className="mr-2 h-4 w-4" /> Add Another Signer
                            </Button>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="signerIsBusiness"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    checked={signerIsBusiness}
                                    onChange={(e) => setSignerIsBusiness(e.target.checked)}
                                />
                                <Label htmlFor="signerIsBusiness" className="cursor-pointer">This is a business signing</Label>
                            </div>

                            {signerIsBusiness && (
                                <div className="space-y-4 p-4 border rounded-md bg-gray-50/50">
                                    <div className="space-y-2">
                                        <Label htmlFor="signerCompany">Business Name</Label>
                                        <Input
                                            id="signerCompany"
                                            placeholder="e.g. Acme Corp"
                                            value={signerCompany}
                                            onChange={(e) => setSignerCompany(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signerCompanyInfo">Additional Business Information</Label>
                                        <textarea
                                            id="signerCompanyInfo"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Address, Registration Number, VAT ID..."
                                            value={signerCompanyInfo}
                                            onChange={(e) => setSignerCompanyInfo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Document Settings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="expirationDays">Days until expiration</Label>
                                <Input
                                    id="expirationDays"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={expirationDays}
                                    onChange={(e) => setExpirationDays(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">How long the signer has to complete the document before the link drops.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                        disabled={!file && !templateId || signers.some(s => !s.name.trim() || !s.email.trim()) || isLoading || !!draggingBlockId}
                        onClick={handleUpload}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        {isLoading ? "Preparing..." : "Send Document"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
