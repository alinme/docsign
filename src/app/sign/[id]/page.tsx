"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Smartphone, PenTool, CheckCircle2, Loader2, FileSignature, Calendar, Type, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getDocumentById, finalizeSignature } from "@/actions/documents";
import { getUserSignature } from "@/actions/signatures";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { createClient } from "@/lib/supabase/client";
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

export default function SignDocumentPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSignerId = searchParams.get('signer');
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
                toast.error("Failed to load document");
                router.push("/");
            } else {
                setDocument(result.data);

                const currentUser = result.data.signers?.find((s: any) => s.id === currentSignerId);
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
            const result = await finalizeSignature(document.id, currentSignerId || '', signatureData, fieldsState);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Document signed successfully!");
                // Force a document refresh to bypass the iframe cache and show the burned PDF
                const refreshedDoc = await getDocumentById(document.id);
                if (refreshedDoc.data) {
                    setDocument({
                        ...refreshedDoc.data,
                        signedUrl: `${refreshedDoc.data.signedUrl}&t=${Date.now()}`
                    });
                }
                setIsSigned(true);
            }
        } catch (error) {
            toast.error("An error occurred during signing.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!document) return null;

    const myBlocks = Array.isArray(document?.sign_coordinates)
        ? document.sign_coordinates.filter((b: any) => b.signerId === currentSignerId || !b.signerId)
        : [];

    const hasSignatureBlock = myBlocks.some((b: any) => !b.type || b.type === 'signature');

    const canSubmit = !isSigned && !isSubmitting && (!hasSignatureBlock || !!signatureData);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
                <div className="flex items-center gap-4 text-sm font-medium text-gray-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-bold">D</div>
                    <span>DocSign</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600 truncate max-w-[200px] md:max-w-md">{document.file_name}</span>
                </div>
                <div className="flex items-center gap-3">
                    {!agreed ? (
                        <Button variant="outline" size="sm" onClick={() => setAgreed(true)}>
                            Review & Agree
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!canSubmit}
                            onClick={handleSign}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isSigned ? "Completed" : "Finish Signing"}
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center">
                <div className="w-full max-w-4xl space-y-6">

                    {!agreed && (
                        <Card className="flex flex-col items-center justify-center gap-4 p-8 border-blue-200 bg-blue-50 text-center">
                            <ShieldAlert className="h-12 w-12 text-blue-600 shrink-0" />
                            <div>
                                <h3 className="text-xl font-semibold text-blue-900">{document.initiator_name || document.initiator_email} has requested your signature.</h3>
                                <p className="mt-2 text-sm text-blue-800/80 max-w-lg mx-auto">
                                    Please review the document below. By clicking "Review & Agree", you consent to doing business electronically with DocSign.
                                </p>
                            </div>
                        </Card>
                    )}

                    {isSigned && (
                        <Card className="flex flex-col items-center justify-center gap-4 p-8 border-emerald-200 bg-emerald-50 text-emerald-800 text-center">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            <div>
                                <h3 className="text-xl font-bold">Document Successfully Signed</h3>
                                <p className="text-sm mt-2 text-emerald-700">You and the Initiator will receive an email with the finalized PDF and audit trail.</p>
                            </div>

                            {isAuthenticated ? (
                                <Button onClick={() => router.push("/")} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                    Return to Dashboard
                                </Button>
                            ) : (
                                <Button onClick={() => router.push("/auth/login")} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                                    Create your own DocSign Account
                                </Button>
                            )}

                        </Card>
                    )}

                    <Card className="relative min-h-[800px] overflow-hidden bg-white shadow-xl ring-1 ring-gray-900/5">
                        <div className="relative w-full h-full bg-gray-200 overflow-y-auto flex justify-center py-8" ref={containerRef}>
                            {document.signedUrl && (
                                <Document
                                    file={`${document.signedUrl}#view=FitH&toolbar=0&navpanes=0`}
                                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                    className="shadow-xl"
                                >
                                    {Array.from(new Array(numPages), (el, index) => (
                                        <div key={`page_${index + 1}`} className="mb-4 relative">
                                            <Page
                                                pageNumber={index + 1}
                                                width={pdfWidth > 800 ? 800 : Math.max(pdfWidth - 64, 300)}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />

                                            {/* Render Advanced Fields Overlays securely into the DOM matrix */}
                                            {Array.isArray(document.sign_coordinates) && document.sign_coordinates.map((block: any, i: number) => {
                                                const targetPageNum = block.pageNum || numPages;
                                                if (targetPageNum !== index + 1) return null;

                                                const isMyBlock = block.signerId === currentSignerId || !block.signerId;
                                                if (!isMyBlock) return null;

                                                const fieldType = block.type || 'signature';

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`absolute z-10 flex items-center justify-center border-2
                                                            ${fieldType === 'signature' ? 'border-amber-400 bg-amber-50/50 w-48 h-16 cursor-pointer hover:border-amber-500 hover:bg-white/80' : ''}
                                                            ${fieldType === 'date' ? 'border-gray-400 bg-gray-50/50 w-48 h-12' : ''}
                                                            ${fieldType === 'text' ? 'border-purple-400 bg-purple-50/50 w-48 h-12' : ''}
                                                            ${fieldType === 'checkbox' ? 'border-green-400 bg-green-50/50 w-8 h-8' : ''}
                                                        `}
                                                        style={{
                                                            left: block.xPct !== undefined ? `${block.xPct * 100}%` : `${block.x}px`,
                                                            top: block.yPct !== undefined ? `${block.yPct * 100}%` : `${block.y}px`
                                                        }}
                                                        onClick={fieldType === 'signature' && !isSigned && agreed ? () => setSignatureData("pending_interaction") : undefined}
                                                    >
                                                        {fieldType === 'signature' && (
                                                            !signatureData ? (
                                                                <div className="flex flex-col items-center justify-center gap-1 text-amber-600 pointer-events-none">
                                                                    <PenTool className="h-5 w-5" />
                                                                    <span className="font-medium text-xs">Click to Sign</span>
                                                                </div>
                                                            ) : signatureData === "pending_interaction" ? (
                                                                <span className="text-amber-600 font-medium text-xs">Waiting...</span>
                                                            ) : (
                                                                <img src={signatureData} alt="Signature" className="max-h-12 w-full object-contain pointer-events-none" />
                                                            )
                                                        )}

                                                        {fieldType === 'date' && (
                                                            <span className="text-gray-700 font-medium text-sm">
                                                                {(fieldsState[block.id] as string) || new Date().toLocaleDateString()}
                                                            </span>
                                                        )}

                                                        {fieldType === 'text' && (
                                                            <input
                                                                type="text"
                                                                className="w-full h-full bg-transparent border-none focus:ring-0 text-center text-sm px-2 text-purple-900 placeholder:text-purple-300"
                                                                placeholder="Type here..."
                                                                disabled={isSigned || !agreed}
                                                                value={fieldsState[block.id] as string || ''}
                                                                onChange={(e) => setFieldsState(prev => ({ ...prev, [block.id]: e.target.value }))}
                                                            />
                                                        )}

                                                        {fieldType === 'checkbox' && (
                                                            <input
                                                                type="checkbox"
                                                                className="w-5 h-5 text-green-600 rounded cursor-pointer"
                                                                disabled={isSigned || !agreed}
                                                                checked={!!fieldsState[block.id]}
                                                                onChange={(e) => setFieldsState(prev => ({ ...prev, [block.id]: e.target.checked }))}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </Document>
                            )}
                        </div>
                    </Card>
                </div>
            </main>

            {agreed && !isSigned && signatureData === "pending_interaction" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg shadow-2xl overflow-hidden rounded-2xl">
                        <div className="border-b bg-gray-50 p-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Adopt Your Signature</h2>
                            <Button variant="ghost" size="sm" onClick={() => setSignatureData(null)}>Cancel</Button>
                        </div>
                        <div className="p-6">
                            <Tabs defaultValue={savedSignatureUrl ? "saved" : "draw"}>
                                <TabsList className={`mb-4 grid w-full ${savedSignatureUrl ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                    {savedSignatureUrl && (
                                        <TabsTrigger value="saved" className="gap-2"><FileSignature className="h-4 w-4" /> Saved</TabsTrigger>
                                    )}
                                    <TabsTrigger value="draw">Draw (Desktop)</TabsTrigger>
                                    <TabsTrigger value="mobile" className="gap-2"><Smartphone className="h-4 w-4" /> Mobile Handoff</TabsTrigger>
                                </TabsList>

                                {savedSignatureUrl && (
                                    <TabsContent value="saved" className="space-y-4">
                                        <div className="rounded-xl border-2 border-green-500/20 bg-green-50/10 p-6 flex flex-col items-center justify-center">
                                            <p className="text-sm font-medium text-emerald-700 mb-4">Your saved signature:</p>
                                            <img src={savedSignatureUrl} alt="Saved Signature" className="max-h-24 object-contain bg-white rounded-lg p-4 shadow-sm border" />
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <Button
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() => setSignatureData(savedSignatureUrl)}
                                            >
                                                Adopt and Sign
                                            </Button>
                                        </div>
                                    </TabsContent>
                                )}

                                <TabsContent value="draw" className="space-y-4">
                                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 relative overflow-hidden">
                                        <SignatureCanvas
                                            ref={sigPad}
                                            penColor="black"
                                            canvasProps={{ className: "w-full h-48" }}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={() => sigPad.current?.clear()}>Clear</Button>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700"
                                            onClick={() => {
                                                if (sigPad.current?.isEmpty()) {
                                                    toast.error("Please provide a signature first");
                                                    return;
                                                }
                                                const dataURL = sigPad.current?.getTrimmedCanvas().toDataURL("image/png");
                                                if (dataURL) setSignatureData(dataURL);
                                            }}
                                        >
                                            Adopt and Sign
                                        </Button>
                                    </div>
                                </TabsContent>

                                <TabsContent value="mobile" className="flex flex-col items-center py-8 text-center">
                                    <div className="mb-4 h-48 w-48 rounded-xl bg-gray-100 flex items-center justify-center border">
                                        <span className="text-gray-400 text-sm font-mono">[ QR CODE SCAN ]</span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Scan to Sign on Mobile</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Point your phone camera at this QR code. Your signature will sync instantly.
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
