"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Smartphone, PenTool, CheckCircle2, Loader2, FileSignature, Calendar, Type, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { getDocumentById, finalizeSignature } from "@/actions/documents";
import { DEFAULT_SIGNATURE_COLOR } from "@/lib/signature";
import { getUserSignature } from "@/actions/signatures";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { pdfDocumentOptions } from "@/lib/pdf-options";
import { useTranslations } from "next-intl";

// Dynamically import react-pdf to avoid SSR DOMMatrix issues
const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

function SignDocumentContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSignerId = searchParams.get('signer');
    const t = useTranslations("Sign");

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
    const sigPad = useRef<SignatureCanvas>(null);
    const supabase = createClient();

    const [document, setDocument] = useState<any>(null);
    const [agreed, setAgreed] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Advanced Fields & PDF Canvas State
    const [numPages, setNumPages] = useState<number>(1);
    const [pdfWidth, setPdfWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [fieldsState, setFieldsState] = useState<Record<string, string | boolean>>({});

    useEffect(() => {
        if (containerRef.current) {
            setPdfWidth(containerRef.current.clientWidth);
        }
    }, [document]);

    useEffect(() => {
        async function checkAuthAndSignature() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsAuthenticated(true);
                const sig = await getUserSignature();
                if (sig && sig.data) {
                    setSavedSignatureUrl(sig.data);
                }
            }
        }
        checkAuthAndSignature();

        async function loadDocument() {
            if (!params.id) return;
            const result = await getDocumentById(params.id as string);

            if (result.error) {
                toast.error(t("failedToLoad"));
                router.push("/");
            } else {
                setDocument(result.data);

                const effectiveId = currentSignerId ?? result.data.signers?.[0]?.id ?? null;
                const currentUser = result.data.signers?.find((s: any) => s.id === effectiveId);
                const isUserSigned = currentUser?.status === "Signed" || currentUser?.status === "Completed";

                if (result.data.status === "Completed" || isUserSigned) {
                    setAgreed(true);
                    setIsSigned(true);
                }
            }
            setIsLoading(false);
        }

        loadDocument();
    }, [params.id, router]);

    const handleSign = async () => {
        if (!signatureData || !document) return;

        setIsSubmitting(true);
        try {
            let clientIp: string | null = null;
            try {
                const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
                const data = await res.json();
                clientIp = data?.ip ?? null;
            } catch {
                // ignore
            }
            const result = await finalizeSignature(document.id, effectiveSignerId ?? '', signatureData, fieldsState, {
                clientIp,
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(t("signedSuccessfully"));
                router.refresh();
                const refreshedDoc = await getDocumentById(document.id);
                if (refreshedDoc.data) {
                    setDocument({
                        ...refreshedDoc.data,
                        signedUrl: refreshedDoc.data.signedUrl ? `${refreshedDoc.data.signedUrl}&t=${Date.now()}` : refreshedDoc.data.signedUrl
                    });
                }
                setIsSigned(true);
            }
        } catch (error) {
            toast.error(t("signingError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!document) return null;

    const effectiveSignerId = currentSignerId ?? document?.signers?.[0]?.id ?? null;
    const myBlocks = Array.isArray(document?.sign_coordinates)
        ? document.sign_coordinates.filter((b: any) => b.signerId === effectiveSignerId || !b.signerId)
        : [];

    const hasSignatureBlock = myBlocks.some((b: any) => !b.type || b.type === 'signature');
    const canSubmit = !isSigned && !isSubmitting && (!hasSignatureBlock || !!signatureData);

    const handleSignLater = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.close();
        } else {
            router.push("/auth/login");
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
                <div className="flex items-center gap-4 text-sm font-medium text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-bold">D</div>
                    <span>{t("docSign")}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground truncate max-w-[200px] md:max-w-md">{document.file_name}</span>
                </div>
                <div className="flex items-center gap-3">
                    {!agreed ? (
                        <Button variant="outline" size="sm" onClick={() => setAgreed(true)}>
                            {t("reviewAndAgree")}
                        </Button>
                    ) : (
                        <>
                            {canSubmit ? (
                                <Button variant="outline" size="sm" onClick={handleSignLater}>
                                    {t("signLater")}
                                </Button>
                            ) : (<></>)}
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                disabled={!canSubmit}
                                onClick={handleSign}
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {isSigned ? t("completed") : t("finishSigning")}
                            </Button>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center">
                <div className="w-full max-w-4xl space-y-6">

                    {!agreed && (
                        <Card className="flex flex-col items-center justify-center gap-4 p-8 border-primary/30 bg-primary/10 text-center">
                            <ShieldAlert className="h-12 w-12 text-primary shrink-0" />
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">{t("requestedSignature", { name: document.initiator_name || document.initiator_email })}</h3>
                                <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
                                    {t("consentText")}
                                </p>
                            </div>
                        </Card>
                    )}

                    {agreed && !isSigned && (
                        <Card className="p-4 border-2 border-amber-500/60 bg-amber-500/20 dark:bg-amber-500/30 text-center">
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                {t("instructionsText")}
                            </p>
                        </Card>
                    )}

                    {agreed && !isSigned && <Separator />}

                    {isSigned && (
                        <Card className="flex flex-col items-center justify-center gap-4 p-8 border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-center">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h3 className="text-xl font-bold">{t("successTitle")}</h3>
                                <p className="text-sm mt-2 text-emerald-700 dark:text-emerald-300">{t("successMessage")}</p>
                            </div>

                            {isAuthenticated ? (
                                <Button onClick={() => router.push("/")} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {t("returnToDashboard")}
                                </Button>
                            ) : (
                                <Button onClick={() => router.push("/auth/login")} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {t("createAccount")}
                                </Button>
                            )}
                        </Card>
                    )}

                    {(agreed || isSigned) && <Separator />}

                    <Card className="relative min-h-[800px] overflow-hidden bg-card shadow-xl ring-1 ring-border">
                        <div className="relative w-full h-full bg-muted overflow-y-auto flex justify-center py-8" ref={containerRef}>
                            {document.signedUrl && (
                                <Document
                                    file={`${document.signedUrl}#view=FitH&toolbar=0&navpanes=0`}
                                    options={pdfDocumentOptions}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    className="shadow-xl"
                                >
                                    {Array.from(new Array(numPages), (el, index) => {
                                        const pageWidth = pdfWidth > 800 ? 800 : Math.max(pdfWidth - 64, 300);
                                        const pageHeight = pageWidth * (11 / 8.5);
                                        return (
                                            <div key={`page_${index + 1}`} className="mb-4 relative" style={{ width: pageWidth, height: pageHeight }}>
                                                <Page
                                                    pageNumber={index + 1}
                                                    width={pageWidth}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                />

                                                {/* Render Advanced Fields Overlays only when not yet signed (placeholders hidden after signing) */}
                                                {!isSigned && Array.isArray(document.sign_coordinates) && document.sign_coordinates.map((block: any, i: number) => {
                                                    const targetPageNum = block.pageNum || numPages;
                                                    if (targetPageNum !== index + 1) return null;

                                                    const isMyBlock = block.signerId === effectiveSignerId || !block.signerId;
                                                    if (!isMyBlock) return null;

                                                    const fieldType = block.type || 'signature';
                                                    const blockKey = block.id ?? `block-${index}-${i}`;

                                                    return (
                                                        <div
                                                            key={blockKey}
                                                            className={`absolute z-30 flex items-center justify-center border-2 rounded min-w-[120px]
                                                            ${fieldType === 'signature' ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/95 w-48 h-16 cursor-pointer hover:border-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/95 shadow-lg ring-2 ring-amber-400/50' : ''}
                                                            ${fieldType === 'date' ? 'border-border bg-muted/90 dark:bg-muted w-48 h-12' : ''}
                                                            ${fieldType === 'text' ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/90 w-48 h-12' : ''}
                                                            ${fieldType === 'checkbox' ? 'border-green-500 bg-green-100 dark:bg-green-900/90 w-8 h-8' : ''}
                                                        `}
                                                            style={{
                                                                left: block.xPct !== undefined ? `${block.xPct * 100}%` : `${block.x}px`,
                                                                top: block.yPct !== undefined ? `${block.yPct * 100}%` : `${block.y}px`
                                                            }}
                                                            onClick={fieldType === 'signature' && !isSigned && agreed ? () => setSignatureData("pending_interaction") : undefined}
                                                        >
                                                            {fieldType === 'signature' && (
                                                                !signatureData ? (
                                                                    <div className="flex flex-col items-center justify-center gap-1 text-amber-900 dark:text-amber-100 pointer-events-none font-medium">
                                                                        <PenTool className="h-5 w-5" />
                                                                        <span className="text-xs font-semibold">{t("clickToSign")}</span>
                                                                    </div>
                                                                ) : signatureData === "pending_interaction" ? (
                                                                    <span className="text-amber-900 dark:text-amber-100 font-medium text-xs">{t("waiting")}</span>
                                                                ) : (
                                                                    <img src={signatureData} alt="Signature" className="max-h-12 w-full object-contain pointer-events-none" />
                                                                )
                                                            )}

                                                            {fieldType === 'date' && (
                                                                <span className="text-foreground font-medium text-sm">
                                                                    {(fieldsState[block.id] as string) || new Date().toLocaleDateString()}
                                                                </span>
                                                            )}

                                                            {fieldType === 'text' && (
                                                                <input
                                                                    type="text"
                                                                    className="w-full h-full bg-transparent border-none focus:ring-0 text-center text-sm px-2 text-foreground placeholder:text-muted-foreground"
                                                                    placeholder={t("typeHere")}
                                                                    disabled={isSigned || !agreed}
                                                                    value={fieldsState[block.id] as string || ''}
                                                                    onChange={(e) => setFieldsState(prev => ({ ...prev, [block.id]: e.target.value }))}
                                                                />
                                                            )}

                                                            {fieldType === 'checkbox' && (
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-5 h-5 text-primary rounded cursor-pointer accent-primary"
                                                                    disabled={isSigned || !agreed}
                                                                    checked={!!fieldsState[block.id]}
                                                                    onChange={(e) => setFieldsState(prev => ({ ...prev, [block.id]: e.target.checked }))}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </Document>
                            )}
                        </div>
                    </Card>
                </div>
            </main>

            {agreed && !isSigned && signatureData === "pending_interaction" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg shadow-2xl overflow-hidden rounded-2xl border-border bg-card">
                        <div className="border-b border-border bg-muted/50 p-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-foreground">{t("adoptSignatureTitle")}</h2>
                            <Button variant="outline" size="sm" className="border-2 border-border bg-background text-foreground" onClick={() => setSignatureData(null)}>{t("cancel")}</Button>
                        </div>
                        <Separator />
                        <div className="p-6">
                            <Tabs defaultValue={savedSignatureUrl ? "saved" : "draw"}>
                                <TabsList className={`mb-4 grid w-full border border-border bg-muted/50 ${savedSignatureUrl ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                    {savedSignatureUrl && (
                                        <TabsTrigger value="saved" className="gap-2 bg-background text-foreground data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border">{t("saved")}</TabsTrigger>
                                    )}
                                    <TabsTrigger value="draw" className="bg-background text-foreground data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border">{t("drawDesktop")}</TabsTrigger>
                                    <TabsTrigger value="mobile" className="gap-2 bg-background text-foreground data-[state=active]:bg-card data-[state=active]:border data-[state=active]:border-border">{t("mobileHandoff")}</TabsTrigger>
                                </TabsList>

                                {savedSignatureUrl && (
                                    <TabsContent value="saved" className="space-y-4">
                                        <div className="rounded-xl border-2 border-border bg-muted/50 p-6 flex flex-col items-center justify-center">
                                            <p className="text-sm font-medium text-foreground mb-4">{t("savedSignature")}</p>
                                            <img src={savedSignatureUrl} alt="Saved Signature" className="max-h-24 object-contain bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border-2 border-border" />
                                        </div>
                                        <Separator />
                                        <div className="flex justify-end gap-3">
                                            <Button className="border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" onClick={() => setSignatureData(savedSignatureUrl)}>
                                                {t("adoptAndSign")}
                                            </Button>
                                        </div>
                                    </TabsContent>
                                )}

                                <TabsContent value="draw" className="space-y-4">
                                    <p className="text-sm text-foreground font-medium">{t("drawBelow")}</p>
                                    <div className="rounded-xl border-2 border-border bg-white dark:bg-zinc-900 relative overflow-hidden min-h-[192px]">
                                        <SignatureCanvas
                                            ref={sigPad}
                                            penColor={document?.signature_color ?? DEFAULT_SIGNATURE_COLOR}
                                            canvasProps={{ className: "w-full h-48 bg-white dark:bg-zinc-900", style: { background: 'white' } }}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" className="border-2 border-border bg-background text-foreground" onClick={() => sigPad.current?.clear()}>{t("clear")}</Button>
                                        <Button className="border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" onClick={() => {
                                            if (sigPad.current?.isEmpty()) { toast.error(t("provideSignatureAuth")); return; }
                                            const dataURL = sigPad.current?.getTrimmedCanvas().toDataURL("image/png");
                                            if (dataURL) setSignatureData(dataURL);
                                        }}>
                                            {t("adoptAndSign")}
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="mobile" className="flex flex-col items-center py-8 text-center">
                                    <div className="mb-4 h-48 w-48 rounded-xl border-2 border-border bg-muted flex items-center justify-center">
                                        <span className="text-muted-foreground text-sm font-mono">{t("qrCodeScan")}</span>
                                    </div>
                                    <h3 className="font-semibold text-foreground">{t("scanToSignMobile")}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{t("scanInstructions")}</p>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function SignDocumentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SignDocumentContent />
        </Suspense>
    );
}
