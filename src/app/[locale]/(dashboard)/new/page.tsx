"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { UploadCloud, File, ArrowRight, X, Loader2, GripHorizontal, Calendar, Type, CheckSquare, PenTool, Plus, ChevronDown, User, Save, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadDocument } from "@/actions/documents";
import { getTemplateById, updateTemplate, updateTemplateName, saveTemplate } from "@/actions/templates";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useTranslations } from "next-intl";

// Dynamically import react-pdf to avoid SSR DOMMatrix issues
const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

function NewDocumentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams.get("template");
    const t = useTranslations("NewDocument");

    useEffect(() => {
        import("react-pdf")
            .then((mod) => mod.pdfjs)
            .then((pdfjs) => {
                if (pdfjs?.GlobalWorkerOptions) {
                    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                }
            })
            .catch(() => { });
    }, []);

    const [file, setFile] = useState<File | null>(null);
    interface SignerInfo {
        id: string;
        name: string;
        email: string;
        isBusiness?: boolean;
        company?: string;
        companyInfo?: string;
    }
    const [signers, setSigners] = useState<SignerInfo[]>([{ id: 'signer-1', name: '', email: '', isBusiness: false, company: '', companyInfo: '' }]);
    const [selectedSignerIdForBlocks, setSelectedSignerIdForBlocks] = useState('signer-1');
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
    const draggingTemplatePageRef = useRef<number | null>(null);

    // Template save (document side only): idle | saving | saved; and Save as template dialog
    type TemplateSaveState = "idle" | "saving" | "saved";
    const [templateSaveState, setTemplateSaveState] = useState<TemplateSaveState>("idle");
    const lastSavedSnapshotRef = useRef<string | null>(null);
    const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
    const [saveAsTemplateName, setSaveAsTemplateName] = useState("");
    const [currentTemplateName, setCurrentTemplateName] = useState("");
    const [renameTemplateOpen, setRenameTemplateOpen] = useState(false);
    const [renameTemplateName, setRenameTemplateName] = useState("");

    useEffect(() => {
        async function loadTemplate() {
            if (templateId) {
                const result = await getTemplateById(templateId);
                if (result.data) {
                    setCurrentTemplateName(result.data.template_name || "");
                    if (result.data.signedUrl) {
                        setPdfUrl(result.data.signedUrl);
                    }
                    const templateSigners = result.data.signers ?? [];
                    if (templateSigners.length > 0) {
                        setSigners(templateSigners.map((s: { id: string; name: string; email: string }) => ({
                            id: s.id,
                            name: s.name,
                            email: s.email,
                            isBusiness: false,
                            company: "",
                            companyInfo: ""
                        })));
                        setSelectedSignerIdForBlocks(templateSigners[0].id);
                    }
                    if (result.data.sign_coordinates) {
                        const coords = result.data.sign_coordinates as (Partial<DocumentField> & { id: string })[];
                        const firstSignerId = templateSigners[0]?.id ?? "signer-1";
                        setSignatureBlocks(coords.map((b): DocumentField => ({
                            id: b.id,
                            type: (b.type as DocumentField["type"]) || "signature",
                            x: typeof b.x === "number" ? b.x : 100,
                            y: typeof b.y === "number" ? b.y : 100,
                            page: typeof b.page === "number" ? b.page : 1,
                            xPct: b.xPct,
                            yPct: b.yPct,
                            pageNum: b.pageNum,
                            signerId: (b.signerId as string) || firstSignerId
                        })));
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

    const handlePointerDown = (e: React.PointerEvent, id: string, isTemplateBlock?: boolean, pageNum?: number) => {
        if (!containerRef.current) return;
        setDraggingBlockId(id);
        draggingTemplatePageRef.current = isTemplateBlock && pageNum != null ? pageNum : null;

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

        const pageNum = draggingTemplatePageRef.current;
        const block = signatureBlocks.find(b => b.id === draggingBlockId);
        const isTemplateBlock = block && block.xPct != null && block.yPct != null && pageNum != null;

        if (isTemplateBlock && block && containerRef.current) {
            const pageEl = containerRef.current.querySelector(`[data-page-index="${pageNum - 1}"]`) as HTMLElement | null;
            if (pageEl) {
                const pageRect = pageEl.getBoundingClientRect();
                const blockWidth = 192;
                const blockHeight = 64;
                const newLeftPx = e.clientX - pageRect.left - dragOffset.x;
                const newTopPx = e.clientY - pageRect.top - dragOffset.y;
                const xPct = Math.max(0, Math.min(1 - blockWidth / pageRect.width, newLeftPx / pageRect.width));
                const yPct = Math.max(0, Math.min(1 - blockHeight / pageRect.height, newTopPx / pageRect.height));
                setSignatureBlocks(prev => prev.map(b =>
                    b.id === draggingBlockId ? { ...b, xPct, yPct, pageNum } : b
                ));
            }
            return;
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollTop = containerRef.current.scrollTop;
        const scrollLeft = containerRef.current.scrollLeft;

        let newX = e.clientX - containerRect.left + scrollLeft - dragOffset.x;
        let newY = e.clientY - containerRect.top + scrollTop - dragOffset.y;

        const blockWidth = 192;
        const blockHeight = 64;
        const maxX = containerRef.current.scrollWidth - blockWidth;
        const maxY = containerRef.current.scrollHeight - blockHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setSignatureBlocks(prev => prev.map(b =>
            b.id === draggingBlockId ? { ...b, x: newX, y: newY } : b
        ));
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setDraggingBlockId(null);
        draggingTemplatePageRef.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const addSignatureBlock = (type: FieldType = 'signature') => {
        setSignatureBlocks(prev => {
            const newId = `block-${Date.now()}`;
            if (templateId) {
                const onPage1 = prev.filter(b => (b.pageNum ?? 1) === 1 && b.xPct != null && b.yPct != null);
                const xPct = 0.1;
                const yPct = Math.min(0.85, 0.1 + onPage1.length * 0.15);
                return [
                    ...prev,
                    { id: newId, type, x: 100, y: 100, page: 1, xPct, yPct, pageNum: 1, signerId: selectedSignerIdForBlocks }
                ];
            }
            return [
                ...prev,
                { id: newId, type, x: 150 + (prev.length * 20), y: 150 + (prev.length * 20), page: 1, signerId: selectedSignerIdForBlocks }
            ];
        });
    };

    const removeSignatureBlock = (idToRemove: string) => {
        setSignatureBlocks(prev => prev.filter(block => block.id !== idToRemove));
    };

    // When blocks or signers change after a save, show "Update template" again
    useEffect(() => {
        if (templateSaveState !== "saved" || !templateId) return;
        const snapshot = JSON.stringify({ blocks: signatureBlocks, signers: signers.map(s => ({ id: s.id, name: s.name, email: s.email })) });
        if (lastSavedSnapshotRef.current !== null && snapshot !== lastSavedSnapshotRef.current) {
            setTemplateSaveState("idle");
        }
    }, [signatureBlocks, signers, templateId, templateSaveState]);

    const handleUpdateTemplate = async () => {
        if (!templateId || templateSaveState === "saving") return;
        setTemplateSaveState("saving");
        await new Promise(r => setTimeout(r, 400));
        try {
            const payload = signatureBlocks.map(b => ({
                id: b.id,
                type: b.type,
                x: b.x,
                y: b.y,
                page: b.page,
                xPct: b.xPct,
                yPct: b.yPct,
                pageNum: b.pageNum,
                signerId: b.signerId,
            }));
            const signersPayload = signers.map(s => ({ id: s.id, name: s.name, email: s.email }));
            const result = await updateTemplate(templateId, payload, signersPayload);
            if (result.error) {
                toast.error(result.error);
                setTemplateSaveState("idle");
            } else {
                lastSavedSnapshotRef.current = JSON.stringify({ blocks: signatureBlocks, signers: signersPayload });
                setTemplateSaveState("saved");
                toast.success(t("templateUpdated"));
                setTimeout(() => setTemplateSaveState("idle"), 2000);
            }
        } catch {
            toast.error(t("failedToUpdate"));
            setTemplateSaveState("idle");
        }
    };

    const handleRenameTemplate = async () => {
        const name = renameTemplateName.trim();
        if (!templateId || !name) return;
        try {
            const result = await updateTemplateName(templateId, name);
            if (result.error) {
                toast.error(result.error);
            } else {
                setCurrentTemplateName(name);
                setRenameTemplateOpen(false);
                setRenameTemplateName("");
                toast.success(t("templateRenamed"));
            }
        } catch {
            toast.error(t("failedToRename"));
        }
    };

    const handleSaveAsTemplate = async () => {
        const name = saveAsTemplateName.trim();
        if (!file || !name || templateSaveState === "saving") return;
        setSaveAsTemplateOpen(false);
        setSaveAsTemplateName("");
        setTemplateSaveState("saving");
        await new Promise(r => setTimeout(r, 400));
        try {
            const renderedWidth = pdfWidth > 800 ? 800 : Math.max(0, pdfWidth - 64);
            const renderedHeight = renderedWidth * (11 / 8.5);
            const containerWidth = containerRef.current?.clientWidth || 0;
            const pdfLeftOffset = Math.max(0, (containerWidth - renderedWidth) / 2);
            const parsedBlocks = signatureBlocks.map(block => {
                const xRelative = block.x - pdfLeftOffset;
                let yRemaining = block.y - 32;
                let pageIndex = 0;
                while (yRemaining > renderedHeight + 16 && pageIndex < numPages - 1) {
                    yRemaining -= renderedHeight + 16;
                    pageIndex++;
                }
                const xPct = Math.max(0, Math.min(1, xRelative / renderedWidth));
                const yPct = Math.max(0, Math.min(1, yRemaining / renderedHeight));
                return { ...block, xPct, yPct, pageNum: pageIndex + 1 };
            });
            const formData = new FormData();
            formData.append("file", file);
            formData.append("templateName", name);
            formData.append("signCoordinates", JSON.stringify(parsedBlocks));
            formData.append("signers", JSON.stringify(signers.map(s => ({ id: s.id, name: s.name, email: s.email }))));
            const result = await saveTemplate(formData);
            if (result.error) {
                toast.error(result.error);
                setTemplateSaveState("idle");
            } else {
                setTemplateSaveState("saved");
                toast.success(t("templateSaved"));
                const newTemplateId = result.templateId;
                if (newTemplateId) {
                    router.replace(`/new?template=${newTemplateId}`);
                } else {
                    setTimeout(() => setTemplateSaveState("idle"), 2000);
                }
            }
        } catch {
            toast.error(t("failedToSave"));
            setTemplateSaveState("idle");
        }
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

            if (templateId) {
                const payload = signatureBlocks.map(b => ({
                    id: b.id,
                    type: b.type,
                    x: b.x,
                    y: b.y,
                    page: b.page,
                    xPct: b.xPct,
                    yPct: b.yPct,
                    pageNum: b.pageNum,
                    signerId: b.signerId,
                }));
                formData.append("signCoordinates", JSON.stringify(payload));
            }

            // Only calculate coordinates if we are dealing with a fresh PDF file (no template)
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
                toast.success(t("successSent"));
                router.push("/");
            }
        } catch (error) {
            toast.error(t("failedSent"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground mt-1">{t("description")}</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                {/* Left Column: Toolbar + PDF Viewer */}
                <div className="space-y-4">
                    {/* Toolbar: Add Fields + Assigned To + Remove PDF - only when PDF is loaded, so it doesn't overlap the document */}
                    {pdfUrl && (
                        <div className="flex items-center gap-1 p-2 rounded-lg border border-border bg-card shadow-sm">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 border-border bg-background text-foreground hover:bg-muted min-w-[140px] justify-between">
                                        <User className="h-4 w-4 shrink-0" />
                                        {signers.find(s => s.id === selectedSignerIdForBlocks)?.name || t("signerLabel", { count: (signers.findIndex(s => s.id === selectedSignerIdForBlocks) + 1) || 1 })}
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[180px]">
                                    {signers.map((s, idx) => (
                                        <DropdownMenuItem key={s.id} onClick={() => setSelectedSignerIdForBlocks(s.id)}>
                                            {s.name ? t("signerWithHyphen", { count: idx + 1, name: s.name }) : t("signerLabel", { count: idx + 1 })}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Separator orientation="vertical" className="h-6 mx-1" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1.5 border-border bg-background text-foreground hover:bg-muted">
                                        <Plus className="h-4 w-4 shrink-0" />
                                        {t("addField")}
                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="min-w-[160px]">
                                    <DropdownMenuItem onClick={() => addSignatureBlock('signature')} className="text-amber-700 dark:text-amber-200">
                                        <PenTool className="h-4 w-4 mr-2" /> {t("signature")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addSignatureBlock('date')}>
                                        <Calendar className="h-4 w-4 mr-2" /> {t("date")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addSignatureBlock('text')} className="text-purple-700 dark:text-purple-200">
                                        <Type className="h-4 w-4 mr-2" /> {t("text")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => addSignatureBlock('checkbox')} className="text-emerald-700 dark:text-emerald-200">
                                        <CheckSquare className="h-4 w-4 mr-2" /> {t("checkbox")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Separator orientation="vertical" className="h-6 mx-1" />
                            {templateId ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 border-border bg-background text-foreground hover:bg-muted shrink-0"
                                        onClick={handleUpdateTemplate}
                                        disabled={templateSaveState === "saving"}
                                    >
                                        {templateSaveState === "saving" && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
                                        {templateSaveState === "saved" && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                                        {templateSaveState === "idle" && <Save className="h-4 w-4 shrink-0" />}
                                        {templateSaveState === "saving" && <span className="animate-pulse">{t("saving")}</span>}
                                        {templateSaveState === "saved" && <span>{t("saved")}</span>}
                                        {templateSaveState === "idle" && <span>{t("updateTemplate")}</span>}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 border-border bg-background text-foreground hover:bg-muted shrink-0"
                                        onClick={() => { setRenameTemplateName(currentTemplateName); setRenameTemplateOpen(true); }}
                                        title={t("renameTemplateTitle")}
                                    >
                                        <Pencil className="h-4 w-4 shrink-0" />
                                        {t("rename")}
                                    </Button>
                                </>
                            ) : file ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 border-border bg-background text-foreground hover:bg-muted shrink-0"
                                    onClick={() => setSaveAsTemplateOpen(true)}
                                >
                                    <Save className="h-4 w-4 shrink-0" />
                                    {t("saveAsTemplate")}
                                </Button>
                            ) : null}
                            <Separator orientation="vertical" className="h-6 mx-1" />
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 shrink-0 border-border bg-background text-muted-foreground hover:text-destructive hover:border-destructive/50 ml-auto"
                                onClick={() => templateId ? router.push("/templates") : setFile(null)}
                                title={templateId ? t("exitTemplate") : t("removePdf")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
                        <DialogContent className="sm:max-w-md border-border">
                            <DialogHeader>
                                <DialogTitle>{t("saveAsTemplate")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="template-name-dialog" className="text-sm font-medium">{t("templateName")}</label>
                                    <Input
                                        id="template-name-dialog"
                                        placeholder={t("templateNamePlaceholder")}
                                        value={saveAsTemplateName}
                                        onChange={(e) => setSaveAsTemplateName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveAsTemplate()}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setSaveAsTemplateOpen(false)}>{t("cancel")}</Button>
                                <Button
                                    onClick={handleSaveAsTemplate}
                                    disabled={!saveAsTemplateName.trim()}
                                    className="gap-2"
                                >
                                    {t("saveTemplateBtn")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={renameTemplateOpen} onOpenChange={(open) => { setRenameTemplateOpen(open); if (!open) setRenameTemplateName(""); }}>
                        <DialogContent className="sm:max-w-md border-border">
                            <DialogHeader>
                                <DialogTitle>{t("renameTemplateTitle")}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="rename-template-input" className="text-sm font-medium">{t("templateName")}</label>
                                    <Input
                                        id="rename-template-input"
                                        placeholder={t("templateNamePlaceholder")}
                                        value={renameTemplateName}
                                        onChange={(e) => setRenameTemplateName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleRenameTemplate()}
                                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="outline" onClick={() => setRenameTemplateOpen(false)}>{t("cancel")}</Button>
                                <Button onClick={handleRenameTemplate} disabled={!renameTemplateName.trim()} className="gap-2">
                                    {t("rename")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Card className={`py-0 w-full flex flex-col overflow-hidden bg-muted border-2 border-dashed border-border relative ${!pdfUrl ? 'min-h-[800px] items-center justify-center' : 'h-[800px] min-h-[800px]'}`}>
                        {!pdfUrl ? (
                            <div
                                className="py-6 w-full flex-1 flex flex-col items-center justify-center p-12 text-center min-h-0"
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <div className="rounded-full bg-primary/10 p-4">
                                    <UploadCloud className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold">{t("dragDrop")}</h3>
                                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                                    {t("orClick")}
                                </p>
                                <div className="mt-6">
                                    <Button asChild variant="outline" className="cursor-pointer font-semibold shadow-sm text-sm">
                                        <label htmlFor="file-upload">{t("selectFile")}</label>
                                    </Button>
                                    <input id="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileInput} />
                                </div>
                            </div>
                        ) : (
                            <div className="relative flex-1 w-full min-h-0 bg-secondary overflow-y-auto flex items-start justify-center py-8" ref={containerRef}>
                                {pdfUrl && (
                                    <Document
                                        file={pdfUrl}
                                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                        className="shadow-xl"
                                    >
                                        {Array.from(new Array(numPages), (el, index) => {
                                            const pageWidth = pdfWidth > 0 ? Math.min(800, pdfWidth - 32) : 800;
                                            const blocksOnThisPage = signatureBlocks.filter(
                                                b => (b.pageNum ?? 1) === index + 1 && b.xPct != null && b.yPct != null
                                            );
                                            return (
                                                <div key={`page_${index + 1}`} className="mb-4 relative" style={{ width: pageWidth }} data-page-index={index}>
                                                    <Page
                                                        pageNumber={index + 1}
                                                        width={pageWidth}
                                                        renderTextLayer={false}
                                                        renderAnnotationLayer={false}
                                                    />
                                                    {/* Template-loaded blocks: position by % relative to this page; draggable to adjust */}
                                                    {blocksOnThisPage.map(block => (
                                                        <div
                                                            key={block.id}
                                                            className={`absolute z-10 w-48 h-16 border-2 border-dashed rounded flex items-center justify-center shadow-lg cursor-grab touch-none
                                                            ${block.type === 'signature' ? 'bg-amber-100 dark:bg-amber-900/90 border-amber-500 text-amber-900 dark:text-amber-100' :
                                                                    block.type === 'date' ? 'bg-muted border-border text-foreground' :
                                                                        block.type === 'text' ? 'bg-purple-200 dark:bg-purple-900/80 border-purple-500 text-purple-900 dark:text-purple-100' :
                                                                            'bg-emerald-200 dark:bg-emerald-900/80 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                                                                }
                                                            ${draggingBlockId === block.id ? 'cursor-grabbing shadow-xl ring-2 ring-amber-500' : ''}`}
                                                            style={{
                                                                left: `${(block.xPct ?? 0) * 100}%`,
                                                                top: `${(block.yPct ?? 0) * 100}%`,
                                                                touchAction: 'none'
                                                            }}
                                                            onPointerDown={(ev) => handlePointerDown(ev, block.id, true, block.pageNum ?? index + 1)}
                                                            onPointerMove={handlePointerMove}
                                                            onPointerUp={handlePointerUp}
                                                            onPointerCancel={handlePointerUp}
                                                        >
                                                            <div className="flex flex-col items-start justify-center w-full px-3 pointer-events-none min-w-0">
                                                                <div className="flex items-center gap-2 font-semibold text-sm w-full">
                                                                    <GripHorizontal className="h-4 w-4 shrink-0" />
                                                                    {block.type === 'signature' && t("signHere")}
                                                                    {block.type === 'date' && t("dateSigned")}
                                                                    {block.type === 'text' && t("textInput")}
                                                                    {block.type === 'checkbox' && t("checkbox")}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
                                                                    {signers.find(s => s.id === block.signerId)?.name || `Signer ${(signers.findIndex(s => s.id === block.signerId) + 1) || 1}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </Document>
                                )}

                                {/* Draggable blocks when no template and blocks use container-level pixel coords (legacy single-page or fallback) */}
                                {!templateId && signatureBlocks.filter(b => b.xPct == null || b.yPct == null).length > 0 && (
                                    <>
                                        {signatureBlocks.filter(b => b.xPct == null || b.yPct == null).map(block => (
                                            <div
                                                key={block.id}
                                                className={`absolute z-10 w-48 h-16 border-2 border-dashed rounded flex items-center justify-center shadow-lg transition-shadow cursor-grab
                                                    ${block.type === 'signature' ? 'bg-amber-100 dark:bg-amber-900/90 border-amber-500 text-amber-900 dark:text-amber-100' :
                                                        block.type === 'date' ? 'bg-muted border-border text-foreground' :
                                                            block.type === 'text' ? 'bg-purple-200 dark:bg-purple-900/80 border-purple-500 text-purple-900 dark:text-purple-100' :
                                                                'bg-emerald-200 dark:bg-emerald-900/80 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                                                    }
                                                    ${draggingBlockId === block.id ? 'cursor-grabbing shadow-xl ring-2 ring-amber-500' : ''}`}
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
                                                <div className="flex items-center justify-between w-full px-3 font-semibold text-sm min-w-0">
                                                    <div className="flex flex-col items-start justify-center min-w-0 pointer-events-none">
                                                        <div className="flex items-center gap-2">
                                                            <GripHorizontal className="h-4 w-4 shrink-0" />
                                                            {block.type === 'signature' && t("signHere")}
                                                            {block.type === 'date' && t("dateSigned")}
                                                            {block.type === 'text' && t("textInput")}
                                                            {block.type === 'checkbox' && t("checkbox")}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
                                                            {signers.find(s => s.id === block.signerId)?.name || t("signerLabel", { count: (signers.findIndex(s => s.id === block.signerId) + 1) || 1 })}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="p-1 hover:bg-background/50 rounded hover:text-destructive pointer-events-auto transition-colors shrink-0"
                                                        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeSignatureBlock(block.id); }}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Details Form */}
                <div className="space-y-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("signerDetails")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FieldGroup className="space-y-2">
                                {signers.map((s, idx) => (
                                    <div key={s.id}>
                                        {idx > 0 && <Separator className="my-3" />}
                                        <div className="relative space-y-2">
                                            {signers.length > 1 && (
                                                <Button type="button" variant="ghost" size="sm" className="absolute top-0 right-0 h-6 w-6 p-0 text-red-500" onClick={() => {
                                                    const filteredSigners = signers.filter(sig => sig.id !== s.id);
                                                    setSigners(filteredSigners);
                                                    if (selectedSignerIdForBlocks === s.id) {
                                                        setSelectedSignerIdForBlocks(filteredSigners[0].id);
                                                    }
                                                }}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Field>
                                                <div className="flex items-center gap-2">
                                                    <FieldLabel htmlFor={`signer-name-${s.id}`}>{t("signerNameX", { count: idx + 1 })}</FieldLabel>
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-muted-foreground hover:text-foreground text-xs"
                                                        onClick={async () => {
                                                            const supabase = createClient();
                                                            const { data: { user } } = await supabase.auth.getUser();
                                                            if (!user) {
                                                                toast.error(t("notSignedIn"));
                                                                return;
                                                            }
                                                            const name = (user.user_metadata?.full_name as string) ?? user.email ?? "";
                                                            const email = user.email ?? "";
                                                            setSigners(signers.map(sig => sig.id === s.id ? { ...sig, name, email } : sig));
                                                            toast.success(email ? t("filledDetailsWithEmail", { email }) : t("filledDetails"));
                                                        }}
                                                    >
                                                        {t("me")}
                                                    </Button>
                                                </div>
                                                <Input
                                                    id={`signer-name-${s.id}`}
                                                    placeholder={t("signerNamePlaceholder")}
                                                    value={s.name}
                                                    onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, name: e.target.value } : sig))}
                                                />
                                            </Field>
                                            <Field>
                                                <FieldLabel htmlFor={`signer-email-${s.id}`}>{t("signerEmailX", { count: idx + 1 })}</FieldLabel>
                                                <Input
                                                    id={`signer-email-${s.id}`}
                                                    type="email"
                                                    placeholder={t("signerEmailPlaceholder")}
                                                    value={s.email}
                                                    onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, email: e.target.value } : sig))}
                                                />
                                            </Field>

                                            <FieldSet>
                                                <FieldLegend variant="label">{t("signingType")}</FieldLegend>
                                                <FieldDescription>{t("signingTypeDesc")}</FieldDescription>
                                                <RadioGroup
                                                    value={(s.isBusiness ?? false) ? "business" : "personal"}
                                                    onValueChange={(v) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, isBusiness: v === "business" } : sig))}
                                                    className="grid gap-2 pt-1"
                                                >
                                                    <FieldLabel htmlFor={`signing-personal-${s.id}`} className="cursor-pointer">
                                                        <Field orientation="horizontal" className="w-full">
                                                            <FieldContent>
                                                                <FieldTitle>{t("personal")}</FieldTitle>
                                                            </FieldContent>
                                                            <RadioGroupItem value="personal" id={`signing-personal-${s.id}`} />
                                                        </Field>
                                                    </FieldLabel>
                                                    <FieldLabel htmlFor={`signing-business-${s.id}`} className="cursor-pointer">
                                                        <Field orientation="horizontal" className="w-full">
                                                            <FieldContent>
                                                                <FieldTitle>{t("business")}</FieldTitle>
                                                            </FieldContent>
                                                            <RadioGroupItem value="business" id={`signing-business-${s.id}`} />
                                                        </Field>
                                                    </FieldLabel>
                                                </RadioGroup>
                                            </FieldSet>

                                            {(s.isBusiness ?? false) && (
                                                <FieldGroup className="rounded-md bg-muted/50 py-4 gap-4">
                                                    <Field>
                                                        <FieldLabel htmlFor={`signerCompany-${s.id}`}>{t("businessName")}</FieldLabel>
                                                        <Input
                                                            id={`signerCompany-${s.id}`}
                                                            placeholder={t("businessNamePlaceholder")}
                                                            value={s.company ?? ''}
                                                            onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, company: e.target.value } : sig))}
                                                        />
                                                    </Field>
                                                    <Field>
                                                        <FieldLabel htmlFor={`signerCompanyInfo-${s.id}`}>{t("additionalInfo")}</FieldLabel>
                                                        <FieldDescription>{t("additionalInfoDesc")}</FieldDescription>
                                                        <Textarea
                                                            id={`signerCompanyInfo-${s.id}`}
                                                            placeholder={t("additionalInfoPlaceholder")}
                                                            value={s.companyInfo ?? ''}
                                                            onChange={(e) => setSigners(signers.map(sig => sig.id === s.id ? { ...sig, companyInfo: e.target.value } : sig))}
                                                            rows={3}
                                                            className="resize-none"
                                                        />
                                                    </Field>
                                                </FieldGroup>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setSigners([...signers, { id: `signer-${Date.now()}`, name: '', email: '', isBusiness: false, company: '', companyInfo: '' }])}>
                                    <Plus className="mr-2 h-4 w-4" /> {t("addAnotherSigner")}
                                </Button>
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("documentSettings")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Field>
                                <FieldLabel htmlFor="expirationDays">{t("daysUntilExpiration")}</FieldLabel>
                                <FieldDescription>{t("expirationDesc")}</FieldDescription>
                                <Input
                                    id="expirationDays"
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={expirationDays}
                                    onChange={(e) => setExpirationDays(e.target.value)}
                                />
                            </Field>
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        size="lg"
                        disabled={!file && !templateId || signers.some(s => !s.name.trim() || !s.email.trim()) || isLoading || !!draggingBlockId}
                        onClick={handleUpload}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        {isLoading ? t("preparing") : t("sendDocument")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function NewDocumentPage() {
    return (
        <Suspense fallback={
            <div className="mx-auto max-w-6xl flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <NewDocumentContent />
        </Suspense>
    );
}
